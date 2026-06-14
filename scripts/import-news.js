const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const fieldAliases = {
  sitetitle: "siteTitle",
  "site title": "siteTitle",
  title: "siteTitle",
  站点标题: "siteTitle",
  issue: "issue",
  期数: "issue",
  月报: "issue",
  date: "date",
  日期: "date",
  category: "category",
  分类: "category",
  eyebrow: "eyebrow",
  眉题: "eyebrow",
  section: "sectionTitle",
  "section title": "sectionTitle",
  栏目: "sectionTitle",
  区块标题: "sectionTitle",
  description: "description",
  描述: "description",
  导语: "description",
  footer: "footer",
  页脚: "footer",
};

const articleAliases = {
  source: "source",
  来源: "source",
  title: "title",
  标题: "title",
  url: "url",
  link: "url",
  链接: "url",
  summary: "summary",
  摘要: "summary",
  总结: "summary",
  image: "image",
  图片: "image",
  "image alt": "imageAlt",
  imagealt: "imageAlt",
  图片描述: "imageAlt",
  "read time": "readTime",
  readtime: "readTime",
  阅读时长: "readTime",
};

const defaultContent = {
  siteTitle: "AI Native Growth",
  issue: "月度总结",
  date: new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date()),
  category: "Technology / Business",
  eyebrow: "News Overview",
  sectionTitle: "本月新闻",
  description: "AI native growth monthly news brief.",
  footer:
    "Built as a neutral news brief. Typography and color are tuned toward a classic newspaper reading experience using system-available fonts.",
};

const sourceByHost = [
  ["techcrunch.com", "TechCrunch"],
  ["adexchanger.com", "AdExchanger"],
  ["lennysnewsletter.com", "Lenny's Newsletter"],
  ["economist.com", "The Economist"],
  ["anthropic.com", "Anthropic"],
  ["doordash.com", "DoorDash"],
];

const fallbackImages = [
  "assets/economist-thumb.svg",
  "assets/anthropic-thumb.svg",
  "assets/peec-ai.jpg",
  "assets/doordash.jpg",
];

function parseArgs(argv) {
  const options = {
    input: path.join(root, "content", "inbox.md"),
    output: path.join(root, "content", "articles.json"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      options.input = path.resolve(root, argv[i + 1]);
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      options.output = path.resolve(root, argv[i + 1]);
      i += 1;
    }
  }

  return options;
}

function normalizeKey(rawKey) {
  return rawKey
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

function readKeyValue(line) {
  const match = line.match(/^(?:[-*]\s*)?([^:：]+)\s*[:：]\s*(.*)$/);
  if (!match) return null;
  return {
    key: normalizeKey(match[1]),
    value: match[2].trim(),
  };
}

function startArticleFromHeading(heading) {
  const parts = heading.split("|").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      source: parts[0],
      title: parts.slice(1).join(" | "),
    };
  }
  return { title: heading };
}

function inferSource(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const match = sourceByHost.find(([domain]) => host.endsWith(domain));
    return match ? match[1] : host;
  } catch {
    return "";
  }
}

function estimateReadTime(article) {
  const text = `${article.title ?? ""}${article.summary ?? ""}`;
  const minutes = Math.max(2, Math.ceil(Array.from(text).length / 700));
  return `${minutes} MIN READ`;
}

function normalizeArticle(article, index) {
  const normalized = { ...article };
  if (!normalized.source && normalized.url) normalized.source = inferSource(normalized.url);
  if (!normalized.image) normalized.image = fallbackImages[index % fallbackImages.length];
  if (!normalized.imageAlt) normalized.imageAlt = normalized.title || "Article thumbnail";
  if (!normalized.readTime) normalized.readTime = estimateReadTime(normalized);
  return normalized;
}

function validate(content) {
  const requiredArticleFields = ["source", "title", "summary", "url"];
  if (!content.articles.length) {
    throw new Error("No articles found. Add at least one `## Source | Title` block.");
  }

  content.articles.forEach((article, index) => {
    const missing = requiredArticleFields.filter((field) => !article[field]);
    if (missing.length) {
      throw new Error(
        `Article ${index + 1} is missing required field(s): ${missing.join(", ")}`,
      );
    }
    if (!/^https?:\/\//i.test(article.url)) {
      throw new Error(`Article ${index + 1} URL must start with http:// or https://`);
    }
  });
}

function parseInbox(markdown) {
  const content = { ...defaultContent, articles: [] };
  let currentArticle = null;
  let lastTarget = null;
  let lastField = null;

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("<!--")) continue;

    const levelOne = line.match(/^#\s+(.+)$/);
    if (levelOne && !currentArticle) {
      content.siteTitle = levelOne[1].trim();
      continue;
    }

    const articleHeading = line.match(/^##+\s+(.+)$/);
    if (articleHeading) {
      currentArticle = startArticleFromHeading(articleHeading[1].trim());
      content.articles.push(currentArticle);
      lastTarget = currentArticle;
      lastField = null;
      continue;
    }

    const keyValue = readKeyValue(line);
    if (keyValue) {
      const metaField = fieldAliases[keyValue.key];
      const articleField = articleAliases[keyValue.key];

      if (currentArticle && articleField) {
        currentArticle[articleField] = keyValue.value;
        lastTarget = currentArticle;
        lastField = articleField;
      } else if (!currentArticle && metaField) {
        content[metaField] = keyValue.value;
        lastTarget = content;
        lastField = metaField;
      }
      continue;
    }

    if (lastTarget && lastField) {
      lastTarget[lastField] = `${lastTarget[lastField]}\n${line}`.trim();
    }
  }

  content.articles = content.articles.map(normalizeArticle);
  validate(content);
  return content;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const markdown = fs.readFileSync(options.input, "utf8");
  const content = parseInbox(markdown);

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(content, null, 2)}\n`, "utf8");

  console.log(`Imported ${content.articles.length} article(s) from ${path.relative(root, options.input)}`);
  console.log(`Wrote ${path.relative(root, options.output)}`);
}

main();
