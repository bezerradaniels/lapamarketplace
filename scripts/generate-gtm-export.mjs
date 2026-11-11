#!/usr/bin/env node
/**
 * Gera o arquivo de importação do Google Tag Manager a partir do catálogo
 * de eventos em src/lib/analytics/events.json.
 *
 * Uso:
 *   npm run gtm:export                       (usa o ID G-2CN2GCKBX0)
 *   GA4_MEASUREMENT_ID=G-ABC123 npm run gtm:export
 *
 * Saída: gtm/lapa-marketplace-gtm.json
 * Importar em: GTM → Admin → Importar contêiner → Mesclar (Merge).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  readFileSync(resolve(root, "src/lib/analytics/events.json"), "utf8")
);

const GTM_PUBLIC_ID = "GTM-MS8T2DQV";
const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || "G-2CN2GCKBX0";
const ACCOUNT_ID = "0";
const CONTAINER_ID = "0";
const INITIALIZATION_ALL_PAGES = "2147479573";
const FOLDER_ID = "1";
const MEASUREMENT_VAR = "GA4 - Measurement ID";

const base = { accountId: ACCOUNT_ID, containerId: CONTAINER_ID };
const tpl = (key, value) => ({ type: "TEMPLATE", key, value: String(value) });
const bool = (key, value) => ({ type: "BOOLEAN", key, value: String(value) });

let nextId = 10;
const id = () => String(nextId++);

// ---------- Variáveis ----------
const variables = [
  {
    ...base,
    variableId: id(),
    name: MEASUREMENT_VAR,
    type: "c",
    parameter: [tpl("value", MEASUREMENT_ID)],
    parentFolderId: FOLDER_ID,
  },
];

const dlvName = (param) => `DLV - ${param}`;
for (const param of Object.keys(catalog.params)) {
  variables.push({
    ...base,
    variableId: id(),
    name: dlvName(param),
    type: "v",
    notes: catalog.params[param],
    parameter: [
      { type: "INTEGER", key: "dataLayerVersion", value: "2" },
      bool("setDefaultValue", false),
      tpl("name", param),
    ],
    parentFolderId: FOLDER_ID,
  });
}

// ---------- Triggers + Tags ----------
const triggers = [];
const tags = [
  {
    ...base,
    tagId: id(),
    name: "GA4 - Google Tag",
    type: "googtag",
    parameter: [tpl("tagId", `{{${MEASUREMENT_VAR}}}`)],
    firingTriggerId: [INITIALIZATION_ALL_PAGES],
    tagFiringOption: "ONCE_PER_EVENT",
    parentFolderId: FOLDER_ID,
  },
];

for (const event of catalog.events) {
  const triggerId = id();
  triggers.push({
    ...base,
    triggerId,
    name: `CE - ${event.name}`,
    type: "CUSTOM_EVENT",
    customEventFilter: [
      {
        type: "EQUALS",
        parameter: [tpl("arg0", "{{_event}}"), tpl("arg1", event.name)],
      },
    ],
    notes: event.description,
    parentFolderId: FOLDER_ID,
  });

  const parameter = [
    tpl("eventName", event.name),
    tpl("measurementIdOverride", `{{${MEASUREMENT_VAR}}}`),
    bool("sendEcommerceData", Boolean(event.ecommerce)),
  ];
  if (event.ecommerce) {
    parameter.push(tpl("getEcommerceDataFrom", "dataLayer"));
  }
  if (event.params?.length) {
    parameter.push({
      type: "LIST",
      key: "eventSettingsTable",
      list: event.params.map((param) => ({
        type: "MAP",
        map: [
          tpl("parameter", param),
          tpl("parameterValue", `{{${dlvName(param)}}}`),
        ],
      })),
    });
  }

  tags.push({
    ...base,
    tagId: id(),
    name: `GA4 - ${event.name}`,
    type: "gaawe",
    notes: event.keyEvent
      ? `${event.description} — marcar como evento principal (key event) no GA4.`
      : event.description,
    parameter,
    firingTriggerId: [triggerId],
    tagFiringOption: "ONCE_PER_EVENT",
    parentFolderId: FOLDER_ID,
  });
}

const container = {
  exportFormatVersion: 2,
  exportTime: new Date().toISOString().replace("T", " ").slice(0, 19),
  containerVersion: {
    path: `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/versions/0`,
    ...base,
    containerVersionId: "0",
    container: {
      path: `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}`,
      ...base,
      name: "Lapa Marketplace",
      publicId: GTM_PUBLIC_ID,
      usageContext: ["WEB"],
    },
    folder: [{ ...base, folderId: FOLDER_ID, name: "Lapa Marketplace - GA4" }],
    tag: tags,
    trigger: triggers,
    variable: variables,
    builtInVariable: [{ ...base, type: "EVENT", name: "Event" }],
  },
};

const outDir = resolve(root, "gtm");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "lapa-marketplace-gtm.json");
writeFileSync(outFile, JSON.stringify(container, null, 2) + "\n");

console.log(
  `GTM: ${tags.length} tags, ${triggers.length} acionadores, ${variables.length} variáveis → ${outFile}`
);
if (!/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) {
  console.log(
    "Aviso: ID de medição do GA4 é placeholder. Rode com GA4_MEASUREMENT_ID=G-... ou edite a variável 'GA4 - Measurement ID' no GTM após importar."
  );
}
