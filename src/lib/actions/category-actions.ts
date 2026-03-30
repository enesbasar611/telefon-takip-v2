"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

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
        const existing = await prisma.category.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return { success: false, message: "Aynı isimde bir kategori zaten mevcut." };
        }

        const category = await prisma.category.create({
            data: {
                name: data.name,
                parentId: data.parentId || null,
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
        // Kendi alt kategorisini parent yapmak deadlock döngüsüne sebep olur.
        // Ancak bu frontend UI ile de engellenebilir, DB seviyesinde kontrol
        // için derinlemesine parent ağacı kontrolü gerekebilir. 
        // Şimdilik sadece ad değişimi ve basit parent değişimi desteklensin.

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
        // Kategoriye bağlı alt kategori var mı kontrolü
        const subCategories = await prisma.category.findFirst({
            where: { parentId: id },
        });

        if (subCategories) {
            return { success: false, message: "Bu kategoriyi silemezsiniz. Lütfen önce içerisindeki alt kategorileri silin veya taşıyın." };
        }

        // Kategoriye bağlı ürün var mı kontrolü
        const products = await prisma.product.findFirst({
            where: { categoryId: id },
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
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        return serializePrisma(categories);
    } catch (error) {
        console.error("getAllCategories error:", error);
        return [];
    }
}
