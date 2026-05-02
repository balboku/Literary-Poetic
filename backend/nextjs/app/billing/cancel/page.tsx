import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f1627] px-4 text-[#f6ead4]">
      <section className="w-full max-w-xl rounded-lg border border-[#b98f49]/35 bg-[#151b2b] p-6 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#d6a85d]">
          Checkout Cancelled
        </p>
        <h1 className="mt-3 text-2xl font-semibold">付款流程已取消</h1>
        <p className="mt-3 leading-7 text-[#f6ead4]/78">
          沒關係，黃銅抽屜還在。你可以回到服務頁重新選擇方案。
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#b98f49]/45 px-4 font-semibold text-[#f6ead4] transition hover:border-[#7ee7da] hover:text-[#7ee7da] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]"
          href="/"
        >
          回到雜貨店
        </Link>
      </section>
    </main>
  );
}
