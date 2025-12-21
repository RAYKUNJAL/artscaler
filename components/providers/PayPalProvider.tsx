'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PaymentService } from "@/lib/payments/payment-service";

export function PayPalProvider({ children }: { children: React.ReactNode }) {
    return (
        <PayPalScriptProvider
            options={{
                clientId: PaymentService.getPayPalClientId(),
                intent: "subscription",
                vault: true
            }}
        >
            {children}
        </PayPalScriptProvider>
    );
}
