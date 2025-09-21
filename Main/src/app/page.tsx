import Link from "next/link";

export default function Home() {
  return (
    <section>
      <h1>Selamat datang 👋</h1>
      <p>Ini contoh <i>CRUD</i> sederhana menggunakan <i>Next.js</i> + <i>Prisma</i> + <i>SQLite</i>.</p>
      <p>
        Mulai dari halaman <Link href="/items">Items</Link>.
      </p>
    </section>
  );
}
