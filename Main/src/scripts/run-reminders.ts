import "dotenv/config";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";

const DAY = 86_400_000;
const range = 14;

(async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      services: { select: { date: true }, orderBy: { date: "desc" }, take: 1 },
    },
  });
  const today = new Date();
  let sent = 0;

  for (const v of vehicles) {
    if (!v.customer?.email) continue;
    const last = v.services[0]?.date ?? v.createdAt;
    const next = new Date(+last + v.serviceIntervalDays * DAY);
    const daysLeft = Math.floor((+next - +today) / DAY);
    if (daysLeft <= range) {
      await sendEmail({
        to: v.customer.email,
        subject: `Pengingat Servis • ${v.plate}`,
        html: `<p>Jatuh tempo sekitar ${next.toLocaleDateString("id-ID")} (${daysLeft} hari).</p>`,
      });
      sent++;
    }
  }
  console.log("Sent:", sent);
  process.exit(0);
})();
