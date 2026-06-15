const fs = require("fs");
const path = require("path");

const root = __dirname;
const latestContentPath = path.join(root, "content", "articles.json");
const issuesContentDir = path.join(root, "content", "issues");
const templatePath = path.join(root, "templates", "index.template.html");
const latestOutputPath = path.join(root, "index.html");
const issuesOutputDir = path.join(root, "issues");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prefixedAsset(value, pathPrefix) {
  const asset = String(value ?? "");
  if (!asset || /^(https?:|data:|#)/i.test(asset)) return asset;
  return `${pathPrefix}${asset}`;
}

function articleCard(article, pathPrefix) {
  return `          <a
            class="story-card"
            href="${escapeHtml(article.url)}"
            rel="noreferrer"
          >
            <span class="story-copy">
              <span class="story-source">${escapeHtml(article.source)}</span>
              <strong>${escapeHtml(article.title)}</strong>
              <small>${escapeHtml(article.summary)}</small>
              <span class="read-time">${escapeHtml(article.readTime)}</span>
            </span>
            <img
              class="story-thumb"
              src="${escapeHtml(prefixedAsset(article.image, pathPrefix))}"
              alt="${escapeHtml(article.imageAlt)}"
            />
          </a>`;
}

function loadIssueFiles() {
  if (!fs.existsSync(issuesContentDir)) return [];

  return fs
    .readdirSync(issuesContentDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const content = JSON.parse(fs.readFileSync(path.join(issuesContentDir, file), "utf8"));
      return {
        slug: content.slug || path.basename(file, ".json"),
        issue: content.issue,
        date: content.date,
        description: content.description,
        articleCount: content.articles?.length ?? 0,
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

function archiveSection(archives, currentSlug, pathPrefix) {
  if (!archives.length) return "";

  const archiveCards = archives
    .map((archive) => {
      const activeClass = archive.slug === currentSlug ? " is-current" : "";
      const href = `${pathPrefix}issues/${archive.slug}/`;
      return `          <a class="archive-card${activeClass}" href="${escapeHtml(href)}">
            <span class="archive-issue">${escapeHtml(archive.issue)}</span>
            <span class="archive-meta">${escapeHtml(archive.date)} · ${escapeHtml(archive.articleCount)} stories</span>
          </a>`;
    })
    .join("\n");

  return `      <section class="archive-section" aria-labelledby="archiveTitle">
        <h2 id="archiveTitle">Archive</h2>
        <div class="archive-grid">
${archiveCards}
        </div>
      </section>`;
}

function renderPage(content, outputPath, options) {
  const template = fs.readFileSync(templatePath, "utf8");
  const pathPrefix = options.pathPrefix ?? "";
  const archives = options.archives ?? [];
  const articleCards = content.articles
    .map((article) => articleCard(article, pathPrefix))
    .join("\n");
  const documentTitle = `${content.siteTitle} - ${content.issue}`;

  const html = template
    .replaceAll("{{documentTitle}}", escapeHtml(documentTitle))
    .replaceAll("{{description}}", escapeHtml(content.description))
    .replaceAll("{{stylesheetHref}}", escapeHtml(`${pathPrefix}styles.css`))
    .replaceAll("{{homeHref}}", escapeHtml(options.homeHref ?? "#top"))
    .replaceAll("{{date}}", escapeHtml(content.date))
    .replaceAll("{{category}}", escapeHtml(content.category))
    .replaceAll("{{siteTitle}}", escapeHtml(content.siteTitle))
    .replaceAll("{{eyebrow}}", escapeHtml(content.eyebrow))
    .replaceAll("{{issue}}", escapeHtml(content.issue))
    .replaceAll("{{sectionTitle}}", escapeHtml(content.sectionTitle))
    .replaceAll("{{articleCards}}", articleCards)
    .replaceAll("{{archiveSection}}", archiveSection(archives, content.slug, pathPrefix))
    .replaceAll("{{footer}}", escapeHtml(content.footer));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");
}

function render() {
  const latestContent = JSON.parse(fs.readFileSync(latestContentPath, "utf8"));
  const archives = loadIssueFiles();

  renderPage(latestContent, latestOutputPath, {
    pathPrefix: "",
    homeHref: "#top",
    archives,
  });

  archives.forEach((archive) => {
    const issuePath = path.join(issuesContentDir, `${archive.slug}.json`);
    const issueContent = JSON.parse(fs.readFileSync(issuePath, "utf8"));
    renderPage(issueContent, path.join(issuesOutputDir, archive.slug, "index.html"), {
      pathPrefix: "../../",
      homeHref: "../../",
      archives,
    });
  });

  console.log("Rendered latest issue to index.html");
  console.log(`Rendered ${archives.length} archived issue page(s)`);
}

render();
