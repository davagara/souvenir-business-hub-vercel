import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types/models';
import { formatStartingPrice } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.photos?.[0];

  return (
    <Link
      to={`/produk/${product.id}`}
      className="group block bg-white border border-[#E6DFD1] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A5F4E]"
    >
      <div className="aspect-[4/3] w-full bg-[#F3EFE6] overflow-hidden">
        <SafeImage
          src={coverImage}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-[#666F69] mb-2 truncate">
          <span>{product.categoryName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">Min. {product.minimumOrderQty} pcs</span>
          {product.isFeatured && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#4A5F4E] font-medium">Unggulan</span>
            </>
          )}
        </div>

        <h3 className="text-base font-semibold text-[#1F2421] leading-snug mb-3 line-clamp-2 group-hover:text-[#4A5F4E] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between pt-3 border-t border-[#F3EFE6]">
          <span className="text-sm font-semibold text-[#1F2421] tabular-nums">
            {formatStartingPrice(product.startingPrice)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4A5F4E] whitespace-nowrap shrink-0">
            Detail
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
