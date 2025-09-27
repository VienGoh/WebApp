import CustomerForm from "@/components/forms/CustomerForm";

export default function NewCustomerPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Tambah Customer</h1>
      <CustomerForm action="create" />
    </section>
  );
}
