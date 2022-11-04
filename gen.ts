import { parse } from "https://deno.land/std@0.162.0/encoding/csv.ts";
import {join} from "https://deno.land/std@0.162.0/path/mod.ts";
import documentDir from "https://deno.land/x/document_dir@0.2.0/mod.ts";

type LangItem = {
  ID: string;
  Unknown: string;
  Index: string;
  Offset: string;
  Text: string;
};

const columns = ["ID", "Unknown", "Index", "Offset", "Text"];

const en = await parseLang("./gamedata/lang/en.lang.csv");
const zh = await parseLang("./gamedata/lang/zh.lang.csv");

// 判断官中文件是否完整
if (en.length !== zh.length) {
  console.log("en.length !== zh.length");
  Deno.exit(1);
}

// 构建官方英文到中文的映射
const en2zh = new Map<string, string>();
en.forEach(({ ID, Text }, i) => {
  if (ID == "8290981") {
    en2zh.set(Text.split("^")[0].toLowerCase(), zh[i].Text.split("^")[0]);
  }
});

const ttcDir = join(documentDir()!, "Elder Scrolls Online/live/AddOns/TamrielTradeCentre")
const content = await Deno.readTextFile(join(ttcDir, "lang/zh.lua"));

// 替换最后的英文
const contentZH = content.replaceAll(/ZO_CreateStringId\("TTC_NPC_([A-Z0-9_]+)", "([a-z0-9\-\' ]+)"\)/g, (_, id, en) => {
  const zh = en2zh.get(en.toLowerCase());
  if (zh === undefined) {
    console.warn(`Missing zh.lang.csv: ${en}`);
    return `ZO_CreateStringId("TTC_NPC_${id}", "${en}")`;
  }
  return `ZO_CreateStringId("TTC_NPC_${id}", "${zh}")`;
});

await Deno.writeTextFile("./TamrielTradeCentre/lang/zh.lua", contentZH);

/**** utils ****/

async function parseLang(path: string) {
  return parse(await Deno.readTextFile(path), {
    skipFirstRow: true,
    columns,
  }) as LangItem[];
}
