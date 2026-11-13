"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, HardHat, PackageCheck, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, Input } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(3, "أدخل الاسم الكامل"),
    phone: z.string().regex(/^[0-9+\-\s()]{6,30}$/, "رقم هاتف غير صالح"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(8, "8 أحرف على الأقل").regex(/[A-Za-z]/, "يجب أن تحتوي على حرف").regex(/\d/, "يجب أن تحتوي على رقم"),
    password_confirmation: z.string(),
    employee_type: z.enum(["engineer", "sales", "warehouse"], { message: "اختر نوع الموظف" }),
  })
  .refine((d) => d.password === d.password_confirmation, { path: ["password_confirmation"], message: "كلمتا المرور غير متطابقتين" });

type Values = z.infer<typeof schema>;

const TYPES = [
  { value: "engineer", label: "مهندس", icon: HardHat },
  { value: "sales", label: "موظف مبيعات", icon: Briefcase },
  { value: "warehouse", label: "موظف مستودع", icon: PackageCheck },
] as const;

export default function RegisterPage() {
  const [done, setDone] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState, setError, watch, setValue } = useForm<Values>({ resolver: zodResolver(schema) });
  const type = watch("employee_type");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await post<{ message: string }>("/auth/register", values);
      setDone(res.message);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.entries(e.errors).forEach(([k, v]) => setError(k as keyof Values, { message: v[0] }));
      } else setError("root", { message: e instanceof Error ? e.message : "حدث خطأ" });
    }
  });

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600"><CheckCircle2 className="h-8 w-8" /></div>
        <h1 className="mt-6 text-[24px] font-semibold text-brand-green">تم إرسال طلبك</h1>
        <p className="mt-3 text-[15px] leading-8 text-gray-700">{done}</p>
        <Link href="/login" className="mt-8 inline-flex h-[46px] items-center rounded-[3px] border border-gold-300 px-6 text-[14px] font-medium text-gold-700 hover:bg-gold-50">العودة لتسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[28px] font-semibold text-brand-green">طلب إنشاء حساب</h1>
      <span className="gold-rule mt-3" />
      <p className="mt-4 text-[14px] text-gray-500">سيتم تفعيل حسابك بعد مراجعته والموافقة عليه من إدارة النظام.</p>
      {formState.errors.root && <div className="mt-5 rounded-[3px] bg-[#fbefee] px-4 py-3 text-[14px] text-danger">{formState.errors.root.message}</div>}

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="الاسم الكامل" error={formState.errors.name?.message} required><Input {...register("name")} autoComplete="name" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رقم الهاتف" error={formState.errors.phone?.message} required><Input {...register("phone")} dir="ltr" className="text-right" autoComplete="tel" /></Field>
          <Field label="البريد الإلكتروني" error={formState.errors.email?.message} required><Input {...register("email")} type="email" dir="ltr" className="text-right" autoComplete="email" /></Field>
        </div>
        <Field label="نوع الموظف" error={formState.errors.employee_type?.message} required>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setValue("employee_type", t.value, { shouldValidate: true })}
                className={cn("flex flex-col items-center gap-1.5 rounded-[3px] border px-2 py-3 text-[13px] transition cursor-pointer", type === t.value ? "border-gold-500 bg-gold-50 text-gold-700" : "border-gray-200 text-gray-700 hover:border-gold-300")}
              >
                <t.icon className="h-5 w-5" /> {t.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="كلمة المرور" error={formState.errors.password?.message} required>
            <div className="relative">
              <Input {...register("password")} type={show ? "text" : "password"} dir="ltr" className="pe-10 text-right" autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-gray-400 cursor-pointer" aria-label="إظهار كلمة المرور">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
          <Field label="تأكيد كلمة المرور" error={formState.errors.password_confirmation?.message} required><Input {...register("password_confirmation")} type={show ? "text" : "password"} dir="ltr" className="text-right" autoComplete="new-password" /></Field>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>إرسال الطلب</Button>
      </form>
      <p className="mt-7 text-center text-[14px] text-gray-500">لديك حساب؟ <Link href="/login" className="font-medium text-gold-600">تسجيل الدخول</Link></p>
    </>
  );
}
