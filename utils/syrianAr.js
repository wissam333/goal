import { ar } from "date-fns/locale"

const syrianMonths = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
]

export const syrianAr = {
  ...ar,
  localize: {
    ...ar.localize,
    month: (n) => syrianMonths[typeof n === "number" ? n : n.getMonth()],
  },
}
