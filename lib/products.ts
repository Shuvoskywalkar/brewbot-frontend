export const brewbotProducts = [
  { id: "coffee", name: "Coffee", pricePaisa: 2000, image: "/coffee-cup.png" },
  { id: "masala-tea", name: "Masala Raw Tea", pricePaisa: 1000, image: "/tea-cup.png" },
  { id: "milk-tea", name: "Milk Tea", pricePaisa: 1500, image: "/milk-tea-cup.png" },
] as const

export type BrewbotProductId = (typeof brewbotProducts)[number]["id"]

export function getBrewbotProduct(id: unknown) {
  return typeof id === "string"
    ? brewbotProducts.find((product) => product.id === id) ?? null
    : null
}
