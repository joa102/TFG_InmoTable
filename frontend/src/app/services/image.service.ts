import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  // ✅ IMAGEN PLACEHOLDER CENTRALIZADA
  private readonly DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

  /**
   * Obtener imagen por defecto
   */
  getDefaultImage(): string {
    return this.DEFAULT_IMAGE;
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.DEFAULT_IMAGE) {
      target.src = this.DEFAULT_IMAGE;
    }
  }

  /**
   * Obtener primera imagen de un array o default
   */
  getFirstImageOrDefault(images: any[]): string {
    if (Array.isArray(images) && images.length > 0 && images[0]?.url) {
      return images[0].url;
    }
    return this.DEFAULT_IMAGE;
  }

  /**
   * Obtener todas las imágenes válidas
   */
  getAllValidImages(images: any[]): string[] {
    if (!Array.isArray(images)) {
      return [this.DEFAULT_IMAGE];
    }

    const validImages = images
      .filter(img => img?.url)
      .map(img => img.url);

    return validImages.length > 0 ? validImages : [this.DEFAULT_IMAGE];
  }

  /**
   * Contar imágenes válidas
   */
  getImageCount(images: any[]): number {
    if (!Array.isArray(images)) {
      return 0;
    }
    return images.filter(img => img?.url).length;
  }
}
