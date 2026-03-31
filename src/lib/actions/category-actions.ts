"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

// Form datası tipleri
export interface CreateCategoryData {
    name: string;
    parentId?: string;
}

export interface UpdateCategoryData {
    id: string;
    name: string;
    parentId?: string;
}

/**
 * Yeni Kategori Ekleme
 */
export async function createCategory(data: CreateCategoryData) {
    try {
        const shopId = await getShopId();
        const existing = await prisma.category.findUnique({
            where: {
                shopId_name: {
                    shopId,
                    name: data.name
                }
            },
        });

        if (existing) {
            return { success: false, message: "Aynı isimde bir kategori zaten mevcut." };
        }

        const category = await prisma.category.create({
            data: {
                name: data.name,
                parentId: data.parentId || null,
                shopId
            },
        });

        revalidatePath("/stok/kategoriler");
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
                name: data.name,
                parentId: data.parentId === "null" ? null : data.parentId || undefined,
                // Eğer frontend "null" string'i yollarsa null yap, aksi takdirde undefined/değer
            },
        });

        revalidatePath("/stok/kategoriler");
        revalidatePath("/stok");

        return { success: true, category: serializePrisma(category) };
    } catch (error: any) {
        console.error("updateCategory error:", error);
        return { success: false, message: "Kategori güncellenirken hata oluştu." };
    }
}

/**
 * Kategori Silme
 */
export async function deleteCategory(id: string) {
    try {
        const shopId = await getShopId();
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing || existing.shopId !== shopId) {
            return { success: false, message: "Kategori bulunamadı veya yetkisiz işlem." };
        }

        // Kategoriye bağlı alt kategori var mı kontrolü
        const subCategories = await prisma.category.findFirst({
            where: { parentId: id, shopId },
        });

        if (subCategories) {
            return { success: false, message: "Bu kategoriyi silemezsiniz. Lütfen önce içerisindeki alt kategorileri silin veya taşıyın." };
        }

        // Kategoriye bağlı ürün var mı kontrolü
        const products = await prisma.product.findFirst({
            where: { categoryId: id, shopId },
        });

        if (products) {
            return { success: false, message: "Bu kategoriyi silemezsiniz. Lütfen önce içerisindeki ürünleri silin veya taşıyın." };
        }

        await prisma.category.delete({
            where: { id },
        });

        revalidatePath("/stok/kategoriler");
        revalidatePath("/stok");

        return { success: true };
    } catch (error: any) {
        console.error("deleteCategory error:", error);
        return { success: false, message: "Kategori silinirken hata oluştu." };
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
            orderBy: { name: 'asc' }
        });
        return serializePrisma(categories);
    } catch (error) {
        console.error("getAllCategories error:", error);
        return [];
    }
}
