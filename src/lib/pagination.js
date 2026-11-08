import { translate } from "./i18n.js";

export const PAGE_SIZE = 30;

export function paginate(items, page, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * size, current * size), current, pages };
}

export function paginationMarkup(current, pages, label, language = "de") {
  if (pages <= 1) return "";
  const previous = current === 1 ? " disabled" : "";
  const next = current === pages ? " disabled" : "";
  return `<nav aria-label="${label}"><ul class="pagination justify-content-center mt-4">
    <li class="page-item${previous}"><button type="button" class="page-link" data-page="${current - 1}"${previous}>${translate(language, "previous")}</button></li>
    <li class="page-item disabled"><span class="page-link" aria-current="page">${translate(language, "pageOf", { page: current, pages })}</span></li>
    <li class="page-item${next}"><button type="button" class="page-link" data-page="${current + 1}"${next}>${translate(language, "next")}</button></li>
  </ul></nav>`;
}
