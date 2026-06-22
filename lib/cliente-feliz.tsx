// Plantilla "Cliente feliz" (1080×1350, formato retrato 4:5) renderizada con
// Satori → SVG. Compone, sobre la foto real del cliente, el marco co-brandeado
// de Red Motos: cabecera "ENTREGA OFICIAL" + "RED MOTOS CHILE", caption con el
// nombre y la moto, footer con WhatsApp/dirección/redes y el logo, y barra web.
//
// La foto y el logo llegan como data-URI PNG. Las fuentes (Oswald) como
// ArrayBuffer. Devuelve el SVG (texto ya vectorizado).

import React from "react";
import satori from "satori";
import { NEGOCIO, SUCURSALES } from "./config";

const ROJO = "#E2231A";
const W = 1080;
const H = 1350;

export interface OpcionesClienteFeliz {
  /** Foto del cliente (cover), como data-URI PNG. */
  fotoDataUri: string;
  /** Logo Red Motos como data-URI PNG (o null). */
  logoDataUri: string | null;
  fontBold: ArrayBuffer;
  fontMedium: ArrayBuffer;
  nombre?: string;
  /** "Marca Modelo" de la moto comprada (opcional). */
  moto?: string;
}

export async function renderClienteFeliz({
  fotoDataUri,
  logoDataUri,
  fontBold,
  fontMedium,
  nombre,
  moto,
}: OpcionesClienteFeliz): Promise<string> {
  const direccion = SUCURSALES[0]?.direccion ?? "Av. Vicuña Mackenna 8264, La Florida";

  return satori(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          position: "relative",
          fontFamily: "Oswald",
          backgroundColor: "#0A0A0A",
        }}
      >
        {/* Foto del cliente (fondo) */}
        <img
          src={fotoDataUri}
          width={W}
          height={H}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />

        {/* Degradado superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: 320,
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0))",
          }}
        />
        {/* Degradado inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: W,
            height: 520,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0))",
          }}
        />

        {/* Cabecera */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            width: W,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", color: ROJO, fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>
            ENTREGA OFICIAL
          </div>
          <div style={{ display: "flex", color: "#FFFFFF", fontSize: 60, fontWeight: 700, letterSpacing: 1 }}>
            RED MOTOS CHILE
          </div>
          <div style={{ display: "flex", width: 200, height: 4, backgroundColor: ROJO, marginTop: 14 }} />
        </div>

        {/* Caption: nombre + moto */}
        <div
          style={{
            position: "absolute",
            bottom: 300,
            left: 0,
            width: W,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingLeft: 60,
            paddingRight: 60,
          }}
        >
          {nombre ? (
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: 50, fontWeight: 700, textAlign: "center" }}>
              {`¡FELICIDADES ${nombre.toUpperCase()}!`}
            </div>
          ) : (
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: 50, fontWeight: 700 }}>
              ¡NUEVA MOTO, NUEVA HISTORIA!
            </div>
          )}
          {moto ? (
            <div style={{ display: "flex", color: "#E5E5E5", fontSize: 32, fontWeight: 500, marginTop: 6 }}>
              {`Se llevó su ${moto}`}
            </div>
          ) : null}
        </div>

        {/* Footer: contacto · logo · redes */}
        <div
          style={{
            position: "absolute",
            bottom: 78,
            left: 0,
            width: W,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingLeft: 64,
            paddingRight: 64,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: ROJO, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
              WHATSAPP
            </div>
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: 30, fontWeight: 500 }}>
              {NEGOCIO.whatsapp}
            </div>
            <div style={{ display: "flex", color: "#A1A1AA", fontSize: 20, fontWeight: 500, marginTop: 6, maxWidth: 360 }}>
              {direccion.toUpperCase()}
            </div>
          </div>

          {logoDataUri && (
            <div style={{ display: "flex", width: 180, height: 180, alignItems: "center", justifyContent: "center" }}>
              <img src={logoDataUri} width={180} height={180} style={{ objectFit: "contain" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", color: ROJO, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
              SIGUENOS
            </div>
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: 30, fontWeight: 500 }}>
              {NEGOCIO.instagram}
            </div>
            <div style={{ display: "flex", color: "#A1A1AA", fontSize: 20, fontWeight: 500, marginTop: 6 }}>
              FB / REDMOTOSCHILE
            </div>
          </div>
        </div>

        {/* Barra web */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: W,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ROJO,
          }}
        >
          <div style={{ display: "flex", color: "#FFFFFF", fontSize: 26, fontWeight: 700, letterSpacing: 6 }}>
            WWW.REDMOTOS.CL
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Oswald", data: fontBold, weight: 700, style: "normal" },
        { name: "Oswald", data: fontMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
