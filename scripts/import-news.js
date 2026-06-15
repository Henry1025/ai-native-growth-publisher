const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const fieldAliases = {
  sitetitle: "siteTitle",
  "site title": "siteTitle",
  title: "siteTitle",
  slug: "slug",
  permalink: "slug",
  issue: "issue",
  date: "date",
  category: "category",
  eyebrow: "eyebrow",
  section: "sectionTitle",
  "section title": "sectionTitle",
  description: "description",
  footer: "footer",
};

const articleAliases = {
  source: "source",
  title: "title",
  url: "url",
  link: "url",
  summary: "summary",
  image: "image",
  "image alt": "imageAlt",
  imagealt: "imageAlt",
  "read time": "readTime",
  readtime: "readTime",
};

const defaultContent = {
  siteTitle: "AI Native Growth",
  issue: "Monthly Brief",
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
    archiveDir: path.join(root, "content", "issues"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      options.input = path.resolve(root, argv[i + 1]);
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      options.output = path.resolve(root, argv[i + 1]);
      i += 1;
    } else if (arg === "--archive-dir") {
      options.archiveDir = path.resolve(root, argv[i + 1]);
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
  const asciiColon = line.indexOf(":");
  const fullWidthColon = line.indexOf("：");
  const colonPositions = [asciiColon, fullWidthColon].filter((index) => index >= 0);
  if (!colonPositions.length) return null;

  const splitAt = Math.min(...colonPositions);
  const rawKey = line.slice(0, splitAt).replace(/^[-*]\s*/, "");
  const value = line.slice(splitAt + 1).trim();
  return {
    key: normalizeKey(rawKey),
    value,
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

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferYear(dateText) {
  const directYear = String(dateText ?? "").match(/\b(20\d{2})\b/);
  if (directYear) return directYear[1];

  const parsed = Date.parse(dateText);
  if (!Number.isNaN(parsed)) {
    return String(new Date(parsed).getFullYear());
  }

  return String(new Date().getFullYear());
}

function inferSlug(content) {
  if (content.slug) return slugify(content.slug);

  const issue = String(content.issue ?? "");
  const issueMonth = issue.match(/(\d{1,2})\s*月/);
  if (issueMonth) {
    return `${inferYear(content.date)}-${issueMonth[1].padStart(2, "0")}`;
  }

  const isoMonth = `${content.date} ${content.issue}`.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])\b/);
  if (isoMonth) {
    return `${isoMonth[1]}-${isoMonth[2].padStart(2, "0")}`;
  }

  return slugify(content.issue) || slugify(content.date) || "latest";
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

  content.slug = inferSlug(content);
  content.articles = content.articles.map(normalizeArticle);
  validate(content);
  return content;
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const markdown = fs.readFileSync(options.input, "utf8");
  const content = parseInbox(markdown);
  const archivePath = path.join(options.archiveDir, `${content.slug}.json`);

  writeJson(options.output, content);
  writeJson(archivePath, content);

  console.log(`Imported ${content.articles.length} article(s) from ${path.relative(root, options.input)}`);
  console.log(`Wrote latest content to ${path.relative(root, options.output)}`);
  console.log(`Archived issue as ${path.relative(root, archivePath)}`);
}

main();
