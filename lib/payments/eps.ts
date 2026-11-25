import { createHmac } from "node:crypto"

const EPS_SANDBOX_API = "https://sandboxpgapi.eps.com.bd"
const EPS_TIMEOUT_MS = 15_000

export class EPSConfigurationError extends Error {
  constructor() {
    super("EPS sandbox credentials are not configured")
    this.name = "EPSConfigurationError"
  }
}

export type EPSCredentials = {
  username: string
  password: string
  hashKey: string
  merchantId: string
  storeId: string
}

export type EPSPaymentDetails = {
  customerOrderId: string
  merchantTransactionId: string
  totalAmountPaisa: number
  successUrl: string
  failUrl: string
  cancelUrl: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
  customerState: string
  customerPostcode: string
  productName: string
}

export type EPSVerification = {
  status: string
  merchantTransactionId: string | null
  epsTransactionId: string | null
  amountPaisa: number | null
}

function readEPSCredentials(): EPSCredentials {
  const username = process.env.EPS_USERNAME
  const password = process.env.EPS_PASSWORD
  const hashKey = process.env.EPS_HASH_KEY
  const merchantId = process.env.EPS_MERCHANT_ID
  const storeId = process.env.EPS_STORE_ID

  if (!username || !password || !hashKey || !merchantId || !storeId) {
    throw new EPSConfigurationError()
  }

  return { username, password, hashKey, merchantId, storeId }
}

function createEPSHash(value: string, hashKey: string) {
  return createHmac("sha512", Buffer.from(hashKey, "utf8"))
    .update(value, "utf8")
    .digest("base64")
}

async function readEPSResponse(response: Response) {
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok || typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("EPS sandbox request failed")
  }

  const data = payload as Record<string, unknown>
  if (data.ErrorCode || data.errorCode || data.ErrorMessage || data.errorMessage) {
    throw new Error("EPS sandbox request failed")
  }

  return data
}

async function getEPSAccessToken(credentials: EPSCredentials) {
  const response = await fetch(`${EPS_SANDBOX_API}/v1/Auth/GetToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": createEPSHash(credentials.username, credentials.hashKey),
    },
    body: JSON.stringify({ userName: credentials.username, password: credentials.password }),
    cache: "no-store",
    signal: AbortSignal.timeout(EPS_TIMEOUT_MS),
  })
  const data = await readEPSResponse(response)

  if (typeof data.token !== "string" || data.token.length === 0) {
    throw new Error("EPS sandbox authentication failed")
  }

  return data.token
}

export async function initializeEPSPayment(details: EPSPaymentDetails) {
  const credentials = readEPSCredentials()
  const token = await getEPSAccessToken(credentials)
  const response = await fetch(`${EPS_SANDBOX_API}/v1/EPSEngine/InitializeEPS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-hash": createEPSHash(details.merchantTransactionId, credentials.hashKey),
    },
    body: JSON.stringify({
      merchantId: credentials.merchantId,
      storeId: credentials.storeId,
      CustomerOrderId: details.customerOrderId,
      merchantTransactionId: details.merchantTransactionId,
      transactionTypeId: 1,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: details.totalAmountPaisa / 100,
      ipAddress: "0.0.0.0",
      version: "1",
      successUrl: details.successUrl,
      failUrl: details.failUrl,
      cancelUrl: details.cancelUrl,
      customerName: details.customerName,
      customerEmail: details.customerEmail,
      customerAddress: details.customerAddress,
      customerAddress2: "",
      customerCity: details.customerCity,
      customerState: details.customerState,
      customerPostcode: details.customerPostcode,
      customerCountry: "BD",
      customerPhone: details.customerPhone,
      shipmentName: "",
      shipmentAddress: "",
      shipmentAddress2: "",
      shipmentCity: "",
      shipmentState: "",
      shipmentPostcode: "",
      shipmentCountry: "",
      valueA: "",
      valueB: "",
      valueC: "",
      valueD: "",
      shippingMethod: "NO",
      noOfItem: "1",
      productName: details.productName,
      productProfile: "general",
      productCategory: "beverage",
      ProductList: [{
        ProductName: details.productName,
        NoOfItem: "1",
        ProductProfile: "general",
        ProductCategory: "beverage",
        ProductPrice: (details.totalAmountPaisa / 100).toFixed(2),
      }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(EPS_TIMEOUT_MS),
  })
  const data = await readEPSResponse(response)
  const redirectUrl = data.RedirectURL

  if (typeof redirectUrl !== "string") {
    throw new Error("EPS sandbox did not return a payment link")
  }

  let parsedRedirectUrl: URL
  try {
    parsedRedirectUrl = new URL(redirectUrl)
  } catch {
    throw new Error("EPS sandbox returned an invalid payment link")
  }

  if (parsedRedirectUrl.protocol !== "https:" || !parsedRedirectUrl.hostname.endsWith(".eps.com.bd")) {
    throw new Error("EPS sandbox returned an unexpected payment host")
  }

  return parsedRedirectUrl.toString()
}

function amountToPaisa(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null
  const amount = String(value).trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) return null

  const [whole, fraction = ""] = amount.split(".")
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return Number.isSafeInteger(paisa) ? paisa : null
}

export async function verifyEPSTransaction(merchantTransactionId: string): Promise<EPSVerification> {
  const credentials = readEPSCredentials()
  const token = await getEPSAccessToken(credentials)
  const url = new URL(`${EPS_SANDBOX_API}/v1/EPSEngine/CheckMerchantTransactionStatus`)
  url.searchParams.set("merchantTransactionId", merchantTransactionId)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-hash": createEPSHash(merchantTransactionId, credentials.hashKey),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(EPS_TIMEOUT_MS),
  })
  const data = await readEPSResponse(response)
  const returnedTransactionId = data.MerchantTransactionId ?? data.merchantTransactionId
  const epsTransactionId = data.EpsTransactionId ?? data.EPSTransactionId
  const status = data.Status ?? data.TransactionStatus
  const totalAmount = data.TotalAmount ?? data.totalAmount

  return {
    status: typeof status === "string" ? status.trim().toLowerCase() : "unknown",
    merchantTransactionId: typeof returnedTransactionId === "string" ? returnedTransactionId : null,
    epsTransactionId: typeof epsTransactionId === "string" ? epsTransactionId : null,
    amountPaisa: amountToPaisa(totalAmount),
  }
}
