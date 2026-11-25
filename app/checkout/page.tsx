import { CheckoutScreen } from "@/components/checkout-screen"
import { getBrewbotProduct } from "@/lib/products"

type CheckoutPageProps = {
  searchParams: Promise<{ product?: string; deviceId?: string }>
}

export const dynamic = "force-dynamic"

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { product, deviceId } = await searchParams
  const selectedProduct = await getBrewbotProduct(product)
  return <CheckoutScreen product={selectedProduct} requestedDeviceId={deviceId} />
}
