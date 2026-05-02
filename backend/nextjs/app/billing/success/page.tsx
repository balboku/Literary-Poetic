import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f1627] px-4 text-[#f6ead4]">
      <section className="w-full max-w-xl rounded-lg border border-[#b98f49]/35 bg-[#151b2b] p-6 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#7ee7da]">
          Payment Complete
        </p>
        <h1 className="mt-3 text-2xl font-semibold">付款完成</h1>
        <p className="mt-3 leading-7 text-[#f6ead4]/78">
          Balbo 已經把你的鑰匙掛回黃銅櫃台。若是單次服務，額度會由
          Stripe webhook 發放；若是訂閱服務，狀態會同步到你的會員資料。
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#d6a85d] px-4 font-semibold text-[#111827] transition hover:bg-[#e5bd76] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]"
          href="/"
        >
          回到雜貨店
        </Link>
      </section>
    </main>
  );
}
