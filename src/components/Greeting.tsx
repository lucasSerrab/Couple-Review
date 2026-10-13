"use client";

import { useEffect, useState } from "react";

/** "Bom dia / Boa tarde / Boa noite" pelo relógio do aparelho (o servidor roda em UTC). */
export function Greeting() {
  const [texto, setTexto] = useState("Olá");
  useEffect(() => {
    const h = new Date().getHours();
    setTexto(h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
  }, []);
  return <>{texto}</>;
}
