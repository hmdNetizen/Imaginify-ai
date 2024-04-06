"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import Transaction from "../database/models/transaction.model";
import { updateCredits } from "./user.actions";

export const checkoutCredits = async (
  transaction: CheckoutTransactionParams
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const amount = Number(transaction.amount) * 100;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: transaction.plan,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      plan: transaction.plan,
      credits: transaction.credits,
      buyerId: transaction.buyerId,
    },
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
  });

  return redirect(session.url!);
};

export const createTransaction = async (
  transactions: CreateTransactionParams
) => {
  try {
    await connectToDatabase();

    const newTransaction = Transaction.create({
      ...transactions,
      buyer: transactions.buyerId,
    });

    await updateCredits(transactions.buyerId, transactions.credits);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
};
