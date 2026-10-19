import { Pencil, Trash2 } from 'lucide-react';

import type { MongoProduct } from '@/admin/types/admin';

import { productImageUrl } from '@/admin/lib/productImage';

import AdminProductCard from '@/admin/components/products/AdminProductCard';

import { formatGhs } from '@/admin/lib/format';

import { cn } from '@/lib/utils';



type AdminProductsTableProps = {

  products: MongoProduct[];

  onEdit: (product: MongoProduct) => void;

  onDelete: (id: string, name: string) => void;

  onToggleSoldOut: (product: MongoProduct, soldOut: boolean) => void;

  onMarkSoldOut: (product: MongoProduct) => void;

  updatingId?: string | null;

};



function stockStatus(product: MongoProduct) {

  if (product.soldOut || product.stock <= 0) {

    return { label: 'Sold out', tone: 'bg-[#f0e8e8] text-[#6b4f4f] border-[#ddd0d0]' };

  }

  if (product.stock <= 5) {

    return { label: 'Low stock', tone: 'bg-[#f3efe6] text-[#6b5c45] border-[#ddd4c4]' };

  }

  return { label: 'In stock', tone: 'bg-[#e8efe9] text-[#4a5f4f] border-[#cdd8cf]' };

}



const AdminProductsTable = ({

  products,

  onEdit,

  onDelete,

  onToggleSoldOut,

  onMarkSoldOut,

  updatingId,

}: AdminProductsTableProps) => (

  <>

    <div className="lg:hidden space-y-2.5">

      {products.map((product) => (

        <AdminProductCard

          key={product._id}

          product={product}

          onEdit={onEdit}

          onDelete={onDelete}

          onToggleSoldOut={onToggleSoldOut}

          onMarkSoldOut={onMarkSoldOut}

          updatingId={updatingId}

        />

      ))}

    </div>



    <div className="hidden lg:block border border-black/10 overflow-x-auto bg-white">

      <table className="w-full min-w-[880px] text-left border-collapse">

        <thead>

          <tr className="bg-black text-white">

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase w-[72px]">

              Image

            </th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Product</th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Category</th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-right">

              Price

            </th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-center">

              Stock

            </th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Status</th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-center min-w-[100px]">

              Out of stock

            </th>

            <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[160px]">

              Actions

            </th>

          </tr>

        </thead>

        <tbody>

          {products.map((product, index) => {

            const img = productImageUrl(product.images?.front);

            const status = stockStatus(product);

            const isSoldOut = Boolean(product.soldOut || product.stock <= 0);

            const busy = updatingId === product._id;



            return (

              <tr

                key={product._id}

                className={cn(

                  'border-t border-black/10 align-middle',

                  index % 2 === 1 && 'bg-black/[0.02]'

                )}

              >

                <td className="px-3 py-3">

                  {img ? (

                    <img

                      src={img}

                      alt={product.name}

                      className="w-14 h-14 object-contain border border-black/10 bg-white p-0.5"

                      loading="lazy"

                    />

                  ) : (

                    <span className="w-14 h-14 border border-dashed border-black/15 bg-black/[0.02] flex items-center justify-center text-[7px] font-bold uppercase text-black/30">

                      No img

                    </span>

                  )}

                </td>

                <td className="px-3 py-3">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-black max-w-[180px]">

                    {product.name}

                  </p>

                  {product.originalPrice && product.originalPrice > product.price ? (

                    <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">

                      Was {formatGhs(product.originalPrice)}

                    </p>

                  ) : null}

                </td>

                <td className="px-3 py-3 text-[9px] font-bold uppercase text-black/60">

                  {product.category}

                </td>

                <td className="px-3 py-3 text-[11px] font-bold tabular-nums text-right whitespace-nowrap">

                  {formatGhs(product.price)}

                </td>

                <td className="px-3 py-3 text-[11px] font-bold tabular-nums text-center">

                  {product.stock}

                </td>

                <td className="px-3 py-3">

                  <span

                    className={cn(

                      'inline-flex px-2 py-0.5 text-[8px] font-bold tracking-[0.1em] uppercase border',

                      status.tone

                    )}

                  >

                    {status.label}

                  </span>

                </td>

                <td className="px-3 py-3 text-center">

                  <label className="inline-flex items-center justify-center gap-2 min-h-[40px] cursor-pointer">

                    <input

                      type="checkbox"

                      checked={isSoldOut}

                      disabled={busy}

                      onChange={(e) => onToggleSoldOut(product, e.target.checked)}

                      className="h-4 w-4 border-black/30 accent-black"

                      aria-label={`Mark ${product.name} out of stock`}

                    />

                  </label>

                </td>

                <td className="px-3 py-3">

                  <div className="flex flex-wrap gap-2">

                    <button

                      type="button"

                      onClick={() => onEdit(product)}

                      className="inline-flex items-center gap-1 border border-black/20 px-2 py-2 min-h-[40px] text-[8px] font-bold tracking-[0.12em] uppercase hover:border-black hover:bg-black/[0.03]"

                    >

                      <Pencil className="w-3.5 h-3.5" />

                      Edit

                    </button>

                    {!isSoldOut ? (

                      <button

                        type="button"

                        disabled={busy}

                        onClick={() => onMarkSoldOut(product)}

                        className="inline-flex items-center px-2 py-2 min-h-[40px] text-[8px] font-bold tracking-[0.12em] uppercase border border-[#ddd0d0] bg-[#f0e8e8] text-[#6b4f4f] hover:border-[#6b4f4f]"

                      >

                        Sold out

                      </button>

                    ) : null}

                    <button

                      type="button"

                      onClick={() => onDelete(product._id, product.name)}

                      className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] text-red-600 hover:text-red-700 border border-black/10"

                      aria-label="Delete product"

                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  </div>

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  </>

);



export default AdminProductsTable;

