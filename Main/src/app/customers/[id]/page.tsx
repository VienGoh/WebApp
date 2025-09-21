import { prisma } from "@/lib/prisma";
import CustomerForm from "@/components/forms/CustomerForm";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const c = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, email: true },
  });
  if (!c) notFound();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Customer</h1>
      <CustomerForm action="edit" id={c.id} defaults={c} />
    </section>
  );
}
