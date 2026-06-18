// Plantilla del post de Instagram (1080×1080) renderizada con Satori → SVG.
// Compone, sobre la moto generada por la IA, el marco de marca de Red Motos:
// cabecera "Concesionario Oficial" + dirección, fila de marcas, footer con
// redes + "Cotiza tu modelo 0KM" + web, y el logo Red Motos al centro.
//
// Las imágenes (moto + logos) llegan como data-URI PNG (Satori no decodifica
// WebP de forma fiable). Las fuentes llegan como ArrayBuffer (Oswald), para no
// depender de fuentes del sistema. Devuelve un Buffer PNG.

import React from "react";
import satori from "satori";

export interface OpcionesPostInstagram {
  /** Moto generada por la IA, como data-URI PNG (fondo del post). */
  motoDataUri: string;
  /** Logo Red Motos, como data-URI PNG (o null si no se pudo cargar). */
  logoDataUri: string | null;
  /** Logos de marca disponibles, como data-URI PNG. */
  marcaLogos: string[];
  /** Oswald 700 (.ttf) como ArrayBuffer. */
  fontBold: ArrayBuffer;
  /** Oswald 500 (.ttf) como ArrayBuffer. */
  fontMedium: ArrayBuffer;
}

const ROJO = "#E2231A";

/** Devuelve el SVG (texto ya vectorizado) del post 1080×1080. */
export async function renderPostInstagram({
  motoDataUri,
  logoDataUri,
  marcaLogos,
  fontBold,
  fontMedium,
}: OpcionesPostInstagram): Promise<string> {
  return satori(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          position: "relative",
          fontFamily: "Oswald",
          backgroundColor: "#0A0A0A",
        }}
      >
        {/* Moto (fondo) */}
        <img
          src={motoDataUri}
          width={1080}
          height={1080}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />

        {/* Degradado superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 340,
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.94), rgba(0,0,0,0))",
          }}
        />
        {/* Degradado inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1080,
            height: 450,
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.97), rgba(0,0,0,0))",
          }}
        />

        {/* Cabecera */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 0,
            width: 1080,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              color: ROJO,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 4,
            }}
          >
            CONCESIONARIO OFICIAL
          </div>
          <div
            style={{
              display: "flex",
              color: "#FFFFFF",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.05,
            }}
          >
            RED MOTOS CHILE
          </div>
          <div
            style={{
              display: "flex",
              color: "#D4D4D4",
              fontSize: 23,
              fontWeight: 500,
              letterSpacing: 3,
              marginTop: 8,
            }}
          >
            AV. VICUÑA MACKENNA 8264, LA FLORIDA
          </div>
          <div
            style={{
              display: "flex",
              width: 200,
              height: 4,
              backgroundColor: ROJO,
              marginTop: 16,
            }}
          />
        </div>

        {/* Fila de marcas */}
        {marcaLogos.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 234,
              left: 0,
              width: 1080,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 30,
            }}
          >
            {marcaLogos.map((src, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 150,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={src}
                  width={150}
                  height={56}
                  style={{ objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bloque inferior: redes · logo · cotiza */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 0,
            width: 1080,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingLeft: 64,
            paddingRight: 64,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: ROJO,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              SIGUENOS
            </div>
            <div
              style={{
                display: "flex",
                color: "#FFFFFF",
                fontSize: 30,
                fontWeight: 500,
              }}
            >
              @redmotoschile
            </div>
            <div
              style={{
                display: "flex",
                color: "#A1A1AA",
                fontSize: 23,
                fontWeight: 500,
              }}
            >
              FB / REDMOTOSCHILE
            </div>
          </div>

          {logoDataUri && (
            <div
              style={{
                display: "flex",
                width: 210,
                height: 210,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logoDataUri}
                width={210}
                height={210}
                style={{ objectFit: "contain" }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 500,
              }}
            >
              COTIZA TU MODELO
            </div>
            <div
              style={{
                display: "flex",
                color: ROJO,
                fontSize: 46,
                fontWeight: 700,
              }}
            >
              0 KM
            </div>
            <div
              style={{
                display: "flex",
                color: "#A1A1AA",
                fontSize: 23,
                fontWeight: 500,
                letterSpacing: 2,
              }}
            >
              CONTACTANOS
            </div>
          </div>
        </div>

        {/* Barra de web */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1080,
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ROJO,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
            }}
          >
            WWW.REDMOTOS.CL
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: "Oswald", data: fontBold, weight: 700, style: "normal" },
        { name: "Oswald", data: fontMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
