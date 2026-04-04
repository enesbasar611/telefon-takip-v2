"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatTitleCase } from "@/lib/formatters";
import { getShopId } from "@/lib/auth";

// Form datası tipleri
export interface CreateCategoryData {
    name: string;
    parentId?: string;
}

export interface UpdateCategoryData {
    id: string;
    name?: string;
    parentId?: string | null;
    order?: number;
}

/**
 * Yeni Kategori Ekleme
 */
export async function createCategory(data: CreateCategoryData) {
    try {
        const shopId = await getShopId();
        const formattedName = formatTitleCase(data.name);

        const existing = await prisma.category.findUnique({
            where: {
                shopId_name: {
                    shopId,
                    name: formattedName
                }
            },
        });

        // Get max order in the same level
        const maxOrder = await prisma.category.aggregate({
            _max: { order: true },
            where: { shopId, parentId: data.parentId || null }
        });

        const category = await prisma.category.create({
            data: {
                name: formattedName,
                parentId: data.parentId || null,
                order: (maxOrder._max.order || 0) + 1,
                shopId
            },
        });

        revalidatePath("/stok");

        return { success: true, category: serializePrisma(category) };
    } catch (error: any) {
        console.error("createCategory error:", error);
        return { success: false, message: "Kategori oluşturulurken hata oluştu." };
    }
}

/**
 * Kategori Güncelleme (İsim veya Üst Kategori Değişimi)
 */
export async function updateCategory(data: UpdateCategoryData) {
    try {
        const shopId = await getShopId();
        const existing = await prisma.category.findUnique({ where: { id: data.id } });
        if (!existing || existing.shopId !== shopId) {
            return { success: false, message: "Kategori bulunamadı veya yetkisiz işlem." };
        }

        const category = await prisma.category.update({
            where: { id: data.id },
            data: {
                name: data.name ? formatTitleCase(data.name) : undefined,
                parentId: data.parentId === "null" ? null : data.parentId || undefined,
                order: data.order !== undefined ? data.order : undefined
            },
        });

        // revalidatePath("/stok/kategoriler");
        revalidatePath("/stok");

        return { success: true, category: serializePrisma(category) };
    } catch (error: any) {
        console.error("updateCategory error:", error);
        return { success: false, message: "Kategori güncellenirken hata oluştu." };
    }
}

/**
 * Toplu Sıralama Güncelleme
 */
export async function reorderCategories(items: { id: string, order: number, parentId: string | null }[]) {
    try {
        const shopId = await getShopId();

        await prisma.$transaction(
            items.map(item => prisma.category.update({
                where: { id: item.id, shopId },
                data: {
                    order: item.order,
                    parentId: item.parentId
                }
            }))
        );

        revalidatePath("/stok");
        return { success: true };
    } catch (error) {
        console.error("reorderCategories error:", error);
        return { success: false, message: "Sıralama güncellenirken hata oluştu." };
    }
}

/**
 * Kategori Silme
 */
/**
 * Kategori Silme (Recursive - Alt kategorileri ve ürünleri temizleyerek)
 */
export async function deleteCategory(id: string) {
    try {
        const shopId = await getShopId();

        // 1. Kategoriyi ve tüm ailesini (alt dallarını) bulalım
        const getCategoryTreeIds = async (catId: string): Promise<string[]> => {
            const subs = await prisma.category.findMany({
                where: { parentId: catId, shopId },
                select: { id: true }
            });

            let ids = [catId];
            for (const sub of subs) {
                const subIds = await getCategoryTreeIds(sub.id);
                ids = [...ids, ...subIds];
            }
            return ids;
        };

        const allFamilyIds = await getCategoryTreeIds(id);

        // 2. Bu ailedeki TÜM ürünleri bulalım ve kritik kayıtlarını kontrol edelim
        const productsInFamily = await prisma.product.findMany({
            where: {
                categoryId: { in: allFamilyIds },
                shopId
            },
            include: {
                _count: {
                    select: {
                        saleItems: true,
                        usedInServices: true,
                        purchaseItems: true,
                        returns: true,
                    }
                }
            }
        });

        // 3. Kritik kayıt kontrolü (Herhangi bir üründe satış vb. varsa silme yapılamaz)
        const productsWithUsage = productsInFamily.filter(p =>
            p._count.saleItems > 0 ||
            p._count.usedInServices > 0 ||
            p._count.purchaseItems > 0 ||
            p._count.returns > 0
        );

        if (productsWithUsage.length > 0) {
            const productNames = productsWithUsage.slice(0, 3).map(p => p.name).join(", ");
            return {
                success: false,
                message: `Bu kategori silinemez. Çünkü içerisindeki bazı ürünlerin (${productNames}${productsWithUsage.length > 3 ? "..." : ""}) satış veya servis kayıtları bulunmaktadır. Önce bu ürünlerin kayıtlarını temizlemeli veya ürünleri başka kategoriye taşımalısınız.`
            };
        }

        // 4. Güvenli Temizlik (Transaction içinde)
        // Ürün id listesini al
        const productIds = productsInFamily.map(p => p.id);

        await prisma.$transaction([
            // Önce ürünlere bağlı yan tabloları temizle
            prisma.inventoryLog.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.inventoryMovement.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.stockAIAlert.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.deviceHubInfo.deleteMany({ where: { productId: { in: productIds } } }),
            prisma.shortageItem.deleteMany({ where: { productId: { in: productIds }, shopId } }),

            // Sonra ürünleri sil
            prisma.product.deleteMany({ where: { id: { in: productIds }, shopId } }),

            // Son olarak kategorileri sil (Derinden yüzeye doğru silmek için ID listesini ters çevirip tek tek veya bağımlılığa göre silmek lazım)
            // Ya da prisma'nın CASCADE'ine güvenmek için şemada CASCADE varsa direkt ana kategoriyi silebiliriz.
            // Ama şemada Category -> Category relasyonda onDelete: Cascade VAR MI bakalım.
        ]);

        // Kategorileri silme (Dallardan köke doğru silmek en güvenlisi)
        // ID listesi [root, child1, child2, grandchild1] gibi geliyor. Ters çevirip silelim.
        for (const catId of [...allFamilyIds].reverse()) {
            await prisma.category.delete({ where: { id: catId } });
        }

        // revalidatePath("/stok/kategoriler");
        revalidatePath("/stok");

        return { success: true };
    } catch (error: any) {
        console.error("deleteCategory error:", error);
        return { success: false, message: "Kategori silinirken hata oluştu." };
    }
}

/**
 * Kategori İçindeki Tüm Ürünleri Temizle (Kategoriler Kalsın)
 */
export async function clearCategoryProducts(id: string) {
    try {
        const shopId = await getShopId();

        const getCategoryTreeIds = async (catId: string): Promise<string[]> => {
            const subs = await prisma.category.findMany({ where: { parentId: catId, shopId }, select: { id: true } });
            let ids = [catId];
            for (const sub of subs) { ids = [...ids, ...await getCategoryTreeIds(sub.id)]; }
            return ids;
        };

        const allFamilyIds = await getCategoryTreeIds(id);
        const productsInFamily = await prisma.product.findMany({
            where: { categoryId: { in: allFamilyIds }, shopId },
            include: {
                _count: {
                    select: { saleItems: true, usedInServices: true, purchaseItems: true, returns: true }
                }
            }
        });

        const productsWithUsage = productsInFamily.filter(p =>
            p._count.saleItems > 0 || p._count.usedInServices > 0 || p._count.purchaseItems > 0 || p._count.returns > 0
        );

        if (productsWithUsage.length > 0) {
            const names = productsWithUsage.slice(0, 3).map(p => p.name).join(", ");
            return { success: false, message: `İçerisinde işlem (satış/servis) görmüş ${productsWithUsage.length} ürün olduğu için temizlik yapılamıyor.` };
        }

        const productIds = productsInFamily.map(p => p.id);
        await prisma.$transaction([
            prisma.inventoryLog.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.inventoryMovement.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.stockAIAlert.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.deviceHubInfo.deleteMany({ where: { productId: { in: productIds } } }),
            prisma.shortageItem.deleteMany({ where: { productId: { in: productIds }, shopId } }),
            prisma.product.deleteMany({ where: { id: { in: productIds }, shopId } }),
        ]);

        // revalidatePath("/stok/kategoriler");
        revalidatePath("/stok");
        return { success: true };
    } catch (error: any) {
        console.error("clearCategoryProducts error:", error);
        return { success: false, message: "Ürünler temizlenirken hata oluştu." };
    }
}

/**
 * Tüm kategorileri flat (düz) yapıda çeker
 */
export async function getAllCategories() {
    try {
        const shopId = await getShopId();
        const categories = await prisma.category.findMany({
            where: { shopId },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' }
            ]
        });
        return serializePrisma(categories);
    } catch (error) {
        console.error("getAllCategories error:", error);
        return [];
    }
}
