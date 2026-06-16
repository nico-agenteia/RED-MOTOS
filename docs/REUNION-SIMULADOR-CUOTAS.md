# 💬 Guía de reunión — Simulador de Cuotas Red Motos

> **Objetivo de la reunión:** capturar las condiciones reales de financiamiento
> (tasas, comisiones, seguros, topes y reglas) para que el simulador de la web
> entregue cuotas **realistas**, no referenciales.
> **Para:** Nicolás · **Con:** dueños de Red Motos.
> Llena los espacios `›___` en vivo. Lo marcado 🔴 es imprescindible.

---

## 0. Cómo funciona el simulador hoy (lo que ya está hecho)

El usuario mueve 3 controles: **valor de la moto**, **pie (%)** y **plazo
(meses)**. Con eso se calcula una cuota con **amortización francesa** (cuotas
iguales) usando una tasa mensual *placeholder*. Hoy dice "[REFERENCIAL]".

**Lo que falta para que sea real (lo de esta reunión):** la tasa verdadera y
todos los costos que se suman a la cuota (comisiones, seguros, impuesto). Sin
eso, la cuota que ve el cliente no coincide con la que le ofrecen en tienda.

---

## 1. Glosario express (para hablar con propiedad)

- **Capital / monto a financiar:** valor de la moto − pie. Sobre esto se cobra
  interés.
- **Pie:** el "enganche" o cuota inicial que paga el cliente.
- **Tasa de interés mensual:** el % que cobra el financista por prestar, al mes.
- **Plazo:** número de cuotas (meses).
- **Amortización francesa:** cuotas mensuales **iguales** (lo estándar). Ya está
  implementada.
- **CAE (Carga Anual Equivalente):** indicador **obligatorio en Chile** (lo
  exige la CMF/SERNAC) que resume en un solo % anual el costo total del crédito
  (interés + comisiones + seguros + gastos). Es lo que permite comparar de
  verdad. Idealmente el simulador lo muestra.
- **Seguro de desgravamen:** seguro que paga el saldo de la deuda si el cliente
  fallece/queda inválido. Casi siempre **obligatorio** en estos créditos.
- **Impuesto de Timbres y Estampillas:** impuesto estatal a las operaciones de
  crédito (≈ 0,066% por mes, **tope 0,8%** del monto). Se suma al costo.
- **Prenda:** la moto queda en **garantía** (prenda sin desplazamiento, inscrita
  en el Registro Civil) hasta pagar. Tiene un costo de inscripción.

---

## 2. CUESTIONARIO — lo que hay que preguntar

### A. ¿Quién financia? 🔴
- ¿El financiamiento es **propio de la casa** o vía **financiera/banco**?
  `›___________________________`
- Si es vía terceros, ¿cuáles? (ej. Forum, Tanner, Santander Consumer, etc.)
  `›___________________________`
- ¿Hay **más de una** opción y el cliente elige? `›___`
- ¿Quién aprueba y en cuánto tiempo? (para el mensaje post-simulación)
  `›___________________________`

### B. Tasa de interés 🔴
- **Tasa mensual** que se usa hoy: `›_____ %` mensual
- ¿La tasa **cambia según el plazo**? (ej. 12 cuotas vs 48 cuotas)
  - 12: `›__%` · 18: `›__%` · 24: `›__%` · 36: `›__%` · 48: `›__%`
- ¿Cambia según el **monto** o el **perfil del cliente**? `›___`
- ¿Es **fija** todo el crédito o variable? `›___`
- ¿Está en **pesos** (no UF)? `›___`
- ¿Cuál es la **tasa máxima/típica** que podemos mostrar como referencia segura?
  `›_____ %`

### C. Pie y plazos 🔴
- **Pie mínimo** exigido: `›_____ %` · ¿Pie máximo? `›_____ %`
- **Plazos disponibles** (marcar): `12  18  24  36  48  60` → otros: `›___`
- ¿El plazo máximo depende del **monto** o de la **moto**? `›___`
- **Monto mínimo y máximo** financiable: `›$________` a `›$________`
- ¿Hay **monto mínimo de cuota**? `›$________`

### D. Comisiones y gastos 🔴 (el corazón del pedido)
> Anota de cada uno: **cuánto** y **cómo se cobra** (monto fijo, % del monto,
> una sola vez al inicio, o mensual).

- **Comisión de apertura / gastos de otorgamiento:** `›$_____` o `›__%`
  · ¿una vez o mensual? `›___`
- **Gastos de inscripción de prenda** (Registro Civil): `›$________`
- **Gastos notariales:** `›$________`
- **Impuesto de Timbres y Estampillas:** ¿lo cobran al cliente? `›___`
  (si sí, se calcula solo: 0,066%/mes, tope 0,8%)
- ¿Algún **otro cargo**? (envío, gestión, etc.) `›___________________`
- ¿Estos gastos se **suman a la cuota**, se pagan **aparte al inicio**, o se
  **financian** dentro del crédito? `›___________________`

### E. Seguros 🔴
- **Seguro de desgravamen:** ¿obligatorio? `›___`
  · costo: `›__% del saldo mensual` o `›$_____ /mes` o `›$_____ una vez`
- **Seguro de la moto** (contra robo/daños): ¿lo **exigen** mientras dure el
  crédito? `›___` · costo aprox: `›$_____ /mes` o `›__%`
- ¿Los seguros están **incluidos en la cuota** o van aparte? `›___`
- ¿Hay seguros **opcionales** que conviene mostrar? `›___________________`

### F. Reglas y casos especiales 🟡
- ¿Existe **primera cuota diferida** o mes de gracia? `›___`
- ¿**Descuentos/bonos** afectan el financiamiento o solo el precio contado?
  `›___`
- ¿La **tasa o condiciones cambian por marca/modelo** (ej. Royal Enfield vs
  Suzuki)? `›___`
- ¿Promos vigentes? (ej. "0% interés a 6 meses", "pie 0") `›___________________`
- ¿Requisitos del cliente que conviene avisar? (renta mínima, antigüedad
  laboral, edad) `›___________________`

### G. Legal / cómo mostrarlo 🟡
- ¿Podemos mostrar **cuota estimada + CAE** o el dueño prefiere mantener
  "solo referencial, sujeto a aprobación"? `›___`
- ¿Qué **disclaimer** exacto quieren que aparezca? `›___________________`
- ¿Cada cuánto **actualizarán las tasas**? (para decidir si va fijo en código o
  editable desde el panel admin) `›___`

---

## 3. Mínimo viable vs. completo

**Si la reunión es corta, asegura al menos esto (🔴):**
1. Tasa mensual (y si varía por plazo).
2. Pie mínimo y plazos disponibles.
3. Comisión de apertura + si hay seguro de desgravamen obligatorio y su costo.
4. Si todo eso se suma a la cuota o va aparte.

Con esos 4 puntos ya podemos pasar de "referencial" a una cuota **creíble**.
El resto (timbres, prenda, seguro de la moto, CAE) lo afinamos después.

---

## 4. Qué haremos con la información (cómo se implementa)

- La **tasa por plazo** y los **costos** entran como configuración (en
  `lib/config.ts` o, mejor, **editable desde el panel admin** si las cambian
  seguido).
- La cuota pasará a calcularse como: cuota francesa sobre el capital **+
  seguros/comisiones** según cómo se cobren, y mostraremos el **total** y, si se
  aprueba, el **CAE**.
- Ajustaremos los topes del simulador (monto, pie, plazos) a los reales.
- Mantendremos un disclaimer claro y el botón "Cotizar por WhatsApp" que ya
  guarda el lead.

---

## 5. Checklist para volver con la tarea lista ✅
- [ ] Tasa(s) mensual(es) por plazo
- [ ] Pie mínimo/máximo y plazos
- [ ] Monto mínimo/máximo financiable
- [ ] Comisión de apertura (monto/forma)
- [ ] Gastos de prenda / notariales / timbres (sí/no, cuánto)
- [ ] Seguro de desgravamen (obligatorio, costo)
- [ ] Seguro de la moto (exigido, costo)
- [ ] ¿Todo se suma a la cuota o va aparte?
- [ ] ¿Mostramos CAE? + disclaimer aprobado
- [ ] ¿Quién financia y tiempo de aprobación?

---
*Doc de apoyo · nico.agenteia · simulador de cuotas Red Motos.*
