import { defineComponent, h, createSSRApp } from 'vue';
import { renderToString as renderToString$1 } from 'vue/server-renderer';
import { escape } from 'html-escaper';
/* empty css                           *//* empty css                        */
/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * This is the Vue + JSX equivalent of using `<div v-html="value" />`
 */
const StaticHtml = defineComponent({
	props: {
		value: String,
		name: String,
	},
	setup({ name, value }) {
		if (!value) return () => null;
		return () => h('astro-slot', { name, innerHTML: value });
	},
});

function check$1(Component) {
	return !!Component['ssrRender'] || !!Component['__ssrInlineRender'];
}

async function renderToStaticMarkup$1(Component, props, slotted) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
	}
	const app = createSSRApp({ render: () => h(Component, props, slots) });
	const html = await renderToString$1(app);
	return { html };
}

const _renderer1 = {
	check: check$1,
	renderToStaticMarkup: renderToStaticMarkup$1,
};

const ASTRO_VERSION = "1.4.6";
function createDeprecatedFetchContentFn() {
  return () => {
    throw new Error("Deprecated: Astro.fetchContent() has been replaced with Astro.glob().");
  };
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult, globValue) => {
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro(filePathname, _site, projectRootStr) {
  const site = _site ? new URL(_site) : void 0;
  const referenceURL = new URL(filePathname, `http://localhost`);
  const projectRoot = new URL(projectRootStr);
  return {
    site,
    generator: `Astro v${ASTRO_VERSION}`,
    fetchContent: createDeprecatedFetchContentFn(),
    glob: createAstroGlobFn(),
    resolve(...segments) {
      let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
      if (resolved.startsWith(projectRoot.pathname)) {
        resolved = "/" + resolved.slice(projectRoot.pathname.length);
      }
      return resolved;
    }
  };
}

const escapeHTML = escape;
class HTMLString extends String {
  get [Symbol.toStringTag]() {
    return "HTMLString";
  }
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};
function isHTMLString(value) {
  return Object.prototype.toString.call(value) === "[object HTMLString]";
}

function removeLeadingForwardSlashWindows(path) {
  return path.startsWith("/") && path[2] === ":" ? path.substring(1) : path;
}

class Metadata {
  constructor(filePathname, opts) {
    this.modules = opts.modules;
    this.hoisted = opts.hoisted;
    this.hydratedComponents = opts.hydratedComponents;
    this.clientOnlyComponents = opts.clientOnlyComponents;
    this.hydrationDirectives = opts.hydrationDirectives;
    this.filePath = removeLeadingForwardSlashWindows(filePathname);
    this.mockURL = new URL(filePathname, "http://example.com");
    this.metadataCache = /* @__PURE__ */ new Map();
  }
  resolvePath(specifier) {
    if (specifier.startsWith(".")) {
      const url = new URL(specifier, this.mockURL);
      return removeLeadingForwardSlashWindows(decodeURI(url.pathname));
    } else {
      return specifier;
    }
  }
  getPath(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentUrl) || null;
  }
  getExport(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentExport) || null;
  }
  getComponentMetadata(Component) {
    if (this.metadataCache.has(Component)) {
      return this.metadataCache.get(Component);
    }
    const metadata = this.findComponentMetadata(Component);
    this.metadataCache.set(Component, metadata);
    return metadata;
  }
  findComponentMetadata(Component) {
    const isCustomElement = typeof Component === "string";
    for (const { module, specifier } of this.modules) {
      const id = this.resolvePath(specifier);
      for (const [key, value] of Object.entries(module)) {
        if (isCustomElement) {
          if (key === "tagName" && Component === value) {
            return {
              componentExport: key,
              componentUrl: id
            };
          }
        } else if (Component === value) {
          return {
            componentExport: key,
            componentUrl: id
          };
        }
      }
    }
    return null;
  }
}
function createMetadata(filePathname, options) {
  return new Metadata(filePathname, options);
}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7,
  Uint8Array: 8,
  Uint16Array: 9,
  Uint32Array: 10
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [
        PROP_TYPE.Map,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object Set]": {
      return [
        PROP_TYPE.Set,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value, metadata, parents))];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, JSON.stringify(Array.from(value))];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, JSON.stringify(Array.from(value))];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, JSON.stringify(Array.from(value))];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      } else {
        return [PROP_TYPE.Value, value];
      }
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

function serializeListValue(value) {
  const hash = {};
  push(value);
  return Object.keys(hash).join(" ");
  function push(item) {
    if (item && typeof item.forEach === "function")
      item.forEach(push);
    else if (item === Object(item))
      Object.keys(item).forEach((name) => {
        if (item[name])
          push(name);
      });
    else {
      item = item === false || item == null ? "" : String(item).trim();
      if (item) {
        item.split(/\s+/).forEach((name) => {
          hash[name] = true;
        });
      }
    }
  }
}

const HydrationDirectivesRaw = ["load", "idle", "media", "visible", "only"];
const HydrationDirectives = new Set(HydrationDirectivesRaw);
const HydrationDirectiveProps = new Set(HydrationDirectivesRaw.map((n) => `client:${n}`));
function extractDirectives(inputProps) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!HydrationDirectives.has(extracted.hydration.directive)) {
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${Array.from(
                HydrationDirectiveProps
              ).join(", ")}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new Error(
              'Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"'
            );
          }
          break;
        }
      }
    } else if (key === "class:list") {
      if (value) {
        extracted.props[key.slice(0, -5)] = serializeListValue(value);
      }
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new Error(
      `Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`
    );
  }
  const island = {
    children: "",
    props: {
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = value;
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(decodeURI(renderer.clientEntrypoint));
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  return island;
}

class SlotString extends HTMLString {
  constructor(content, instructions) {
    super(content);
    this.instructions = instructions;
  }
}
async function renderSlot(_result, slotted, fallback) {
  if (slotted) {
    let iterator = renderChild(slotted);
    let content = "";
    let instructions = null;
    for await (const chunk of iterator) {
      if (chunk.type === "directive") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunk;
      }
    }
    return markHTMLString(new SlotString(content, instructions));
  }
  return fallback;
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlot(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}

async function* renderChild(child) {
  child = await child;
  if (child instanceof SlotString) {
    if (child.instructions) {
      yield* child.instructions;
    }
    yield child;
  } else if (isHTMLString(child)) {
    yield child;
  } else if (Array.isArray(child)) {
    for (const value of child) {
      yield markHTMLString(await renderChild(value));
    }
  } else if (typeof child === "function") {
    yield* renderChild(child());
  } else if (typeof child === "string") {
    yield markHTMLString(escapeHTML(child));
  } else if (!child && child !== 0) ; else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === "[object AstroComponent]") {
    yield* renderAstroComponent(child);
  } else if (ArrayBuffer.isView(child)) {
    yield child;
  } else if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    yield* child;
  } else {
    yield child;
  }
}

var idle_prebuilt_default = `(self.Astro=self.Astro||{}).idle=t=>{const e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)},window.dispatchEvent(new Event("astro:idle"));`;

var load_prebuilt_default = `(self.Astro=self.Astro||{}).load=a=>{(async()=>await(await a())())()},window.dispatchEvent(new Event("astro:load"));`;

var media_prebuilt_default = `(self.Astro=self.Astro||{}).media=(s,a)=>{const t=async()=>{await(await s())()};if(a.value){const e=matchMedia(a.value);e.matches?t():e.addEventListener("change",t,{once:!0})}},window.dispatchEvent(new Event("astro:media"));`;

var only_prebuilt_default = `(self.Astro=self.Astro||{}).only=t=>{(async()=>await(await t())())()},window.dispatchEvent(new Event("astro:only"));`;

var visible_prebuilt_default = `(self.Astro=self.Astro||{}).visible=(s,c,n)=>{const r=async()=>{await(await s())()};let i=new IntersectionObserver(e=>{for(const t of e)if(!!t.isIntersecting){i.disconnect(),r();break}});for(let e=0;e<n.children.length;e++){const t=n.children[e];i.observe(t)}},window.dispatchEvent(new Event("astro:visible"));`;

var astro_island_prebuilt_default = `var l;{const c={0:t=>t,1:t=>JSON.parse(t,o),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,o)),5:t=>new Set(JSON.parse(t,o)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(JSON.parse(t)),9:t=>new Uint16Array(JSON.parse(t)),10:t=>new Uint32Array(JSON.parse(t))},o=(t,s)=>{if(t===""||!Array.isArray(s))return s;const[e,n]=s;return e in c?c[e](n):void 0};customElements.get("astro-island")||customElements.define("astro-island",(l=class extends HTMLElement{constructor(){super(...arguments);this.hydrate=()=>{if(!this.hydrator||this.parentElement&&this.parentElement.closest("astro-island[ssr]"))return;const s=this.querySelectorAll("astro-slot"),e={},n=this.querySelectorAll("template[data-astro-template]");for(const r of n){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(const r of s){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("name")||"default"]=r.innerHTML)}const a=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),o):{};this.hydrator(this)(this.Component,a,e,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),window.removeEventListener("astro:hydrate",this.hydrate),window.dispatchEvent(new CustomEvent("astro:hydrate"))}}connectedCallback(){!this.hasAttribute("await-children")||this.firstChild?this.childrenConnectedCallback():new MutationObserver((s,e)=>{e.disconnect(),this.childrenConnectedCallback()}).observe(this,{childList:!0})}async childrenConnectedCallback(){window.addEventListener("astro:hydrate",this.hydrate);let s=this.getAttribute("before-hydration-url");s&&await import(s),this.start()}start(){const s=JSON.parse(this.getAttribute("opts")),e=this.getAttribute("client");if(Astro[e]===void 0){window.addEventListener(\`astro:\${e}\`,()=>this.start(),{once:!0});return}Astro[e](async()=>{const n=this.getAttribute("renderer-url"),[a,{default:r}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),i=this.getAttribute("component-export")||"default";if(!i.includes("."))this.Component=a[i];else{this.Component=a;for(const d of i.split("."))this.Component=this.Component[d]}return this.hydrator=r,this.hydrate},s,this)}attributeChangedCallback(){this.hydrator&&this.hydrate()}},l.observedAttributes=["props"],l))}`;

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
const hydrationScripts = {
  idle: idle_prebuilt_default,
  load: load_prebuilt_default,
  only: only_prebuilt_default,
  media: media_prebuilt_default,
  visible: visible_prebuilt_default
};
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(directive) {
  if (!(directive in hydrationScripts)) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  const directiveScriptText = hydrationScripts[directive];
  return directiveScriptText;
}
function getPrescripts(type, directive) {
  switch (type) {
    case "both":
      return `<style>astro-island,astro-slot{display:contents}</style><script>${getDirectiveScriptText(directive) + astro_island_prebuilt_default}<\/script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(directive)}<\/script>`;
  }
  return "";
}

const Fragment = Symbol.for("astro:fragment");
const Renderer = Symbol.for("astro:renderer");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function stringifyChunk(result, chunk) {
  switch (chunk.type) {
    case "directive": {
      const { hydration } = chunk;
      let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
      let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
      let prescriptType = needsHydrationScript ? "both" : needsDirectiveScript ? "directive" : null;
      if (prescriptType) {
        let prescripts = getPrescripts(prescriptType, hydration.directive);
        return markHTMLString(prescripts);
      } else {
        return "";
      }
    }
    default: {
      return chunk.toString();
    }
  }
}
class HTMLParts {
  constructor() {
    this.parts = "";
  }
  append(part, result) {
    if (ArrayBuffer.isView(part)) {
      this.parts += decoder.decode(part);
    } else {
      this.parts += stringifyChunk(result, part);
    }
  }
  toString() {
    return this.parts;
  }
  toArrayBuffer() {
    return encoder.encode(this.parts);
  }
}

function validateComponentProps(props, displayName) {
  var _a;
  if (((_a = (Object.assign({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true},{_:process.env._,}))) == null ? void 0 : _a.DEV) && props != null) {
    for (const prop of Object.keys(props)) {
      if (HydrationDirectiveProps.has(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
class AstroComponent {
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }
  get [Symbol.toStringTag]() {
    return "AstroComponent";
  }
  async *[Symbol.asyncIterator]() {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];
      yield markHTMLString(html);
      yield* renderChild(expression);
    }
  }
}
function isAstroComponent(obj) {
  return typeof obj === "object" && Object.prototype.toString.call(obj) === "[object AstroComponent]";
}
function isAstroComponentFactory(obj) {
  return obj == null ? false : !!obj.isAstroComponentFactory;
}
async function* renderAstroComponent(component) {
  for await (const value of component) {
    if (value || value === 0) {
      for await (const chunk of renderChild(value)) {
        switch (chunk.type) {
          case "directive": {
            yield chunk;
            break;
          }
          default: {
            yield markHTMLString(chunk);
            break;
          }
        }
      }
    }
  }
}
async function renderToString(result, componentFactory, props, children) {
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    const response = Component;
    throw response;
  }
  let parts = new HTMLParts();
  for await (const chunk of renderAstroComponent(Component)) {
    parts.append(chunk, result);
  }
  return parts.toString();
}
async function renderToIterable(result, componentFactory, displayName, props, children) {
  validateComponentProps(props, displayName);
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    console.warn(
      `Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
    );
    const response = Component;
    throw response;
  }
  return renderAstroComponent(Component);
}
async function renderTemplate(htmlParts, ...expressions) {
  return new AstroComponent(htmlParts, expressions);
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const toIdent = (k) => k.trim().replace(/(?:(?!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
  if (/[^\w]|\s/.test(match))
    return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${JSON.stringify(value)};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function addAttribute(value, key, shouldEscape = true) {
  if (value == null) {
    return "";
  }
  if (value === false) {
    if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
      return markHTMLString(` ${key}="false"`);
    }
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(serializeListValue(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString) && typeof value === "object") {
    return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (value === true && (key.startsWith("data-") || htmlBooleanAttributes.test(key))) {
    return markHTMLString(` ${key}`);
  } else {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
}
function internalSpreadAttributes(values, shouldEscape = true) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlot(result, slots == null ? void 0 : slots.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName)
    return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
function guessRenderers(componentUrl) {
  const extname = componentUrl == null ? void 0 : componentUrl.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/vue (jsx)"];
    default:
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/vue", "@astrojs/svelte"];
  }
}
function getComponentType(Component) {
  if (Component === Fragment) {
    return "fragment";
  }
  if (Component && typeof Component === "object" && Component["astro:html"]) {
    return "html";
  }
  if (isAstroComponentFactory(Component)) {
    return "astro-factory";
  }
  return "unknown";
}
async function renderComponent(result, displayName, Component, _props, slots = {}) {
  var _a;
  Component = await Component;
  switch (getComponentType(Component)) {
    case "fragment": {
      const children2 = await renderSlot(result, slots == null ? void 0 : slots.default);
      if (children2 == null) {
        return children2;
      }
      return markHTMLString(children2);
    }
    case "html": {
      const { slotInstructions: slotInstructions2, children: children2 } = await renderSlots(result, slots);
      const html2 = Component.render({ slots: children2 });
      const hydrationHtml = slotInstructions2 ? slotInstructions2.map((instr) => stringifyChunk(result, instr)).join("") : "";
      return markHTMLString(hydrationHtml + html2);
    }
    case "astro-factory": {
      async function* renderAstroComponentInline() {
        let iterable = await renderToIterable(result, Component, displayName, _props, slots);
        yield* iterable;
      }
      return renderAstroComponentInline();
    }
  }
  if (!Component && !_props["client:only"]) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers } = result._metadata;
  const metadata = { displayName };
  const { hydration, isPage, props } = extractDirectives(_props);
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  if (Array.isArray(renderers) && renderers.length === 0 && typeof Component !== "string" && !componentIsHTMLElement(Component)) {
    const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`;
    throw new Error(message);
  }
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    if (Component && Component[Renderer]) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ?? (error = e);
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = renderHTMLElement(result, Component, _props, slots);
      return output;
    }
  } else {
    if (metadata.hydrateArgs) {
      const passedName = metadata.hydrateArgs;
      const rendererName = rendererAliases.has(passedName) ? rendererAliases.get(passedName) : passedName;
      renderer = renderers.find(
        ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
      );
    }
    if (!renderer && renderers.length === 1) {
      renderer = renderers[0];
    }
    if (!renderer) {
      const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split(".").pop();
      renderer = renderers.filter(
        ({ name }) => name === `@astrojs/${extname}` || name === extname
      )[0];
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")}" />
`);
    } else if (typeof Component !== "string") {
      const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
      const plural = renderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? "are" : "is"} ${renderers.length} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`);
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          props,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlot(result, slots == null ? void 0 : slots.fallback);
    } else {
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        props,
        children,
        metadata
      ));
    }
  }
  if (renderer && !renderer.clientEntrypoint && renderer.name !== "@astrojs/lit" && metadata.hydrate) {
    throw new Error(
      `${metadata.displayName} component has a \`client:${metadata.hydrate}\` directive, but no client entrypoint was provided by ${renderer.name}!`
    );
  }
  if (!html && typeof Component === "string") {
    const childSlots = Object.values(children).join("");
    const iterable = renderAstroComponent(
      await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
        childSlots === "" && voidElementNames.test(Component) ? `/>` : `>${childSlots}</${Component}>`
      )}`
    );
    html = "";
    for await (const chunk of iterable) {
      html += chunk;
    }
  }
  if (!hydration) {
    return async function* () {
      if (slotInstructions) {
        yield* slotInstructions;
      }
      if (isPage || (renderer == null ? void 0 : renderer.name) === "astro:jsx") {
        yield html;
      } else {
        yield markHTMLString(html.replace(/\<\/?astro-slot\>/g, ""));
      }
    }();
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        if (!html.includes(key === "default" ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
  }
  async function* renderAll() {
    if (slotInstructions) {
      yield* slotInstructions;
    }
    yield { type: "directive", hydration, result };
    yield markHTMLString(renderElement$1("astro-island", island, false));
  }
  return renderAll();
}

const uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};
function renderHead(result) {
  result._metadata.hasRenderedHead = true;
  const styles = Array.from(result.styles).filter(uniqueElements).map((style) => renderElement$1("style", style));
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script, i) => {
    return renderElement$1("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement$1("link", link, false));
  return markHTMLString(links.join("\n") + styles.join("\n") + scripts.join("\n"));
}
async function* maybeRenderHead(result) {
  if (result._metadata.hasRenderedHead) {
    return;
  }
  yield renderHead(result);
}

typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";

function createComponent(cb) {
  cb.isAstroComponentFactory = true;
  return cb;
}
function spreadAttributes(values, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true);
  }
  return markHTMLString(output);
}

const AstroJSX = "astro:jsx";
const Empty = Symbol("empty");
const toSlotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}
function transformSlots(vnode) {
  if (typeof vnode.type === "string")
    return vnode;
  const slots = {};
  if (isVNode(vnode.props.children)) {
    const child = vnode.props.children;
    if (!isVNode(child))
      return;
    if (!("slot" in child.props))
      return;
    const name = toSlotName(child.props.slot);
    slots[name] = [child];
    slots[name]["$$slot"] = true;
    delete child.props.slot;
    delete vnode.props.children;
  }
  if (Array.isArray(vnode.props.children)) {
    vnode.props.children = vnode.props.children.map((child) => {
      if (!isVNode(child))
        return child;
      if (!("slot" in child.props))
        return child;
      const name = toSlotName(child.props.slot);
      if (Array.isArray(slots[name])) {
        slots[name].push(child);
      } else {
        slots[name] = [child];
        slots[name]["$$slot"] = true;
      }
      delete child.props.slot;
      return Empty;
    }).filter((v) => v !== Empty);
  }
  Object.assign(vnode.props, slots);
}
function markRawChildren(child) {
  if (typeof child === "string")
    return markHTMLString(child);
  if (Array.isArray(child))
    return child.map((c) => markRawChildren(c));
  return child;
}
function transformSetDirectives(vnode) {
  if (!("set:html" in vnode.props || "set:text" in vnode.props))
    return;
  if ("set:html" in vnode.props) {
    const children = markRawChildren(vnode.props["set:html"]);
    delete vnode.props["set:html"];
    Object.assign(vnode.props, { children });
    return;
  }
  if ("set:text" in vnode.props) {
    const children = vnode.props["set:text"];
    delete vnode.props["set:text"];
    Object.assign(vnode.props, { children });
    return;
  }
}
function createVNode(type, props) {
  const vnode = {
    [Renderer]: "astro:jsx",
    [AstroJSX]: true,
    type,
    props: props ?? {}
  };
  transformSetDirectives(vnode);
  transformSlots(vnode);
  return vnode;
}

const ClientOnlyPlaceholder = "astro-client-only";
const skipAstroJSXCheck = /* @__PURE__ */ new WeakSet();
let originalConsoleError;
let consoleFilterRefs = 0;
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode):
      return markHTMLString(
        (await Promise.all(vnode.map((v) => renderJSX(result, v)))).join("")
      );
  }
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result._metadata.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case vnode.type.isAstroComponentFactory: {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        return markHTMLString(await renderToString(result, vnode.type, props, slots));
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.type["astro:renderer"]) {
        skipAstroJSXCheck.add(vnode.type);
      }
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function" && !skipAstroJSXCheck.has(vnode.type)) {
        useConsoleFilter();
        try {
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2 && output2[AstroJSX]) {
            return await renderJSX(result, output2);
          } else if (!output2) {
            return await renderJSX(result, output2);
          }
        } catch (e) {
          skipAstroJSXCheck.add(vnode.type);
        } finally {
          finishUsingConsoleFilter();
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0)
              return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponent(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponent(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      if (typeof output !== "string" && Symbol.asyncIterator in output) {
        let parts = new HTMLParts();
        for await (const chunk of output) {
          parts.append(chunk, result);
        }
        return markHTMLString(parts.toString());
      } else {
        return markHTMLString(output);
      }
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, children)}</${tag}>`
    )}`
  );
}
function useConsoleFilter() {
  consoleFilterRefs++;
  if (!originalConsoleError) {
    originalConsoleError = console.error;
    try {
      console.error = filteredConsoleError;
    } catch (error) {
    }
  }
}
function finishUsingConsoleFilter() {
  consoleFilterRefs--;
}
function filteredConsoleError(msg, ...rest) {
  if (consoleFilterRefs > 0 && typeof msg === "string") {
    const isKnownReactHookError = msg.includes("Warning: Invalid hook call.") && msg.includes("https://reactjs.org/link/invalid-hook-call");
    if (isKnownReactHookError)
      return;
  }
  originalConsoleError(msg, ...rest);
}

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, { default: children = null, ...slotted } = {}) {
  if (typeof Component !== "function")
    return false;
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  try {
    const result = await Component({ ...props, ...slots, children });
    return result[AstroJSX];
  } catch (e) {
  }
  return false;
}
async function renderToStaticMarkup(Component, props = {}, { default: children = null, ...slotted } = {}) {
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  const { result } = this;
  const html = await renderJSX(result, createVNode(Component, { ...props, ...slots, children }));
  return { html };
}
var server_default = {
  check,
  renderToStaticMarkup
};

const $$metadata$j = createMetadata("/D:/repos/medicine/src/components/Header.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$j = createAstro("/D:/repos/medicine/src/components/Header.astro", "", "file:///D:/repos/medicine/");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$j, $$props, $$slots);
  Astro2.self = $$Header;
  return renderTemplate`${maybeRenderHead($$result)}<div>
  <nav class="bg-white border-gray-200 px-8 sm:px-4 py-2.5 dark:bg-gray-900">
    <div class="container flex flex-wrap justify-between items-center mx-auto">
      <a href="/" class="flex items-center">
          <img src="../../public/logo_h.png" class="mr-3 w-64" alt="AVA Logo">
      </a>
      <button data-collapse-toggle="navbar-default" type="button" class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
        <span class="sr-only">Open main menu</span>
        <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
      </button>
      <div class="hidden w-full md:block md:w-auto">
        <ul class="flex flex-col p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
          <li>
            <a href="/nosotras" class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Nosotras</a>
          </li>
          <li>
            <a href="/glosario" class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Glosario</a>
          </li>
          <li>
            <img src="https://cdn.britannica.com/68/7668-004-08492AB7/Flag-Colombia.jpg" alt="" style="max-width: 30px;">
          </li>
          <li>
            <a href="https://www.unisabana.edu.co/"><img src="../../public/sabana.png" alt="" style="max-width: 100px;"></a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <nav class="bg-blue-900 flex justify-end px-8 py-2.5 dark:bg-gray-900">
    <div class="hidden w-full md:block md:w-auto" id="navbar-default">
      <ul class="flex flex-col p-4 mt-4 bg-blue-900 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0">
        <li>
          <a href="/" class="block py-2 pr-4 pl-3 text-white rounded hover:bg-blue-800 md:hover:bg-transparent md:border-0 md:hover:text-gray-300 md:p-0">Inicio</a>
        </li>
        <li>
          <a data-dropdown-toggle="dropdown" href="#" class="block py-2 pr-4 pl-3 text-white rounded hover:bg-blue-800  md:hover:bg-transparent md:border-0 md:hover:text-gray-300 md:p-0">Informacion</a>
          <div id="dropdown" class="hidden z-50 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700">
            <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefault">
              <li>
                <a href="/podcast" class="block py-2 px-4 hover:bg-gray-300  dark:hover:bg-gray-600 dark:hover:text-white">La voz de la experiencia</a>
              </li>
            </ul>
          </div>
        </li>
        <li>
          <a data-dropdown-toggle="dropdown2" href="#" class="block py-2 pr-4 pl-3 text-white rounded hover:bg-blue-800  md:hover:bg-transparent md:border-0 md:hover:text-gray-300 md:p-0">Bajas temperaturas</a>
          <div id="dropdown2" class="hidden z-50 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700">
            <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefault2">
              <li>
                <a href="/colombia" class="block py-2 px-4 hover:bg-gray-300 dark:hover:bg-gray-600 dark:hover:text-white">En Colombia</a>
              </li>
              <li>
                <a href="/latam-europa" class="block py-2 px-4 hover:bg-gray-300 dark:hover:bg-gray-600 dark:hover:text-white">Latinoamerica y Europa</a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</div>`;
});

const $$file$j = "D:/repos/medicine/src/components/Header.astro";
const $$url$j = undefined;

const $$module1$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$j,
	default: $$Header,
	file: $$file$j,
	url: $$url$j
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$i = createMetadata("/D:/repos/medicine/src/components/Footer.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$i = createAstro("/D:/repos/medicine/src/components/Footer.astro", "", "file:///D:/repos/medicine/");
const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$i, $$props, $$slots);
  Astro2.self = $$Footer;
  return renderTemplate`${maybeRenderHead($$result)}<footer class="bg-gray-900">
    <div class="grid grid-cols-2 gap-8 py-8 xl:py-24 px-6 xl:px-32 md:grid-cols-4">
        <div>
            <h2 class="mb-6 text-sm font-bold text-red-500 uppercase">Explora</h2>
            <ul class="text-white">
                <li class="mb-4">
                    <a href="/" class=" hover:underline">Regreso a inicio</a>
                </li>
                <li class="mb-4">
                    <a href="/nosotras" class="hover:underline">Sobre nosotras</a>
                </li>
                <li class="mb-4">
                    <a href="/podcast" class="hover:underline">Podcast</a>
                </li>
                <li class="mb-4">
                    <a href="/sabias" class="hover:underline">Sabias que</a>
                </li>
                <li class="mb-4">
                    <a href="/glosario" class="hover:underline">Glosario</a>
                </li>
            </ul>
        </div>
        <div>
            <h2 class="mb-6 text-sm font-bold text-red-500 uppercase">Mas info</h2>
            <ul class="text-white">
                <li class="mb-4">
                    <a href="/colombia" class="hover:underline">Bajas temperaturas en Colombia</a>
                </li>
                <li class="mb-4">
                    <a href="/latam-europa" class="hover:underline">Latinoamerica y Europa</a>
                </li>
            </ul>
        </div>
        <div>
            <h2 class="mb-6 text-sm font-bold text-red-500 uppercase">Conoce mas</h2>
            <ul class="text-white">
                <li class="mb-4">
                    <a href="/acido-base" class="hover:underline">Ácido - base</a>
                </li>
                <li class="mb-4">
                    <a href="/cuidados" class="hover:underline">¿Cómo cuidarte en las bajas temperaturas?</a>
                </li>
            </ul>
        </div>
    </div>
</footer>`;
});

const $$file$i = "D:/repos/medicine/src/components/Footer.astro";
const $$url$i = undefined;

const $$module2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$i,
	default: $$Footer,
	file: $$file$i,
	url: $$url$i
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$h = createMetadata("/D:/repos/medicine/src/layouts/Layout.astro", { modules: [{ module: $$module1$1, specifier: "../components/Header.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "external", src: "https://unpkg.com/flowbite@1.5.3/dist/flowbite.js" }, { type: "external", src: "../../node_modules/flowbite/dist/flowbite.js" }] });
const $$Astro$h = createAstro("/D:/repos/medicine/src/layouts/Layout.astro", "", "file:///D:/repos/medicine/");
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$h, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/svg+xml" href="/favicon.svg">
		<meta name="generator"${addAttribute(Astro2.generator, "content")}>
		
		${maybeRenderHead($$result)}
		<link rel="stylesheet" href="https://unpkg.com/flowbite@1.5.3/dist/flowbite.min.css">
		<title>${title}</title>
	${renderHead($$result)}</head>
	<body>
		${renderComponent($$result, "Header", $$Header, {})}
		${renderSlot($$result, $$slots["default"])}
		<!-- <Footer /> -->
	
</body></html>`;
});

const $$file$h = "D:/repos/medicine/src/layouts/Layout.astro";
const $$url$h = undefined;

const $$module1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$h,
	default: $$Layout,
	file: $$file$h,
	url: $$url$h
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$g = createMetadata("/D:/repos/medicine/src/pages/index.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$g = createAstro("/D:/repos/medicine/src/pages/index.astro", "", "file:///D:/repos/medicine/");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$g, $$props, $$slots);
  Astro2.self = $$Index;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Inicio | AVA", "class": "astro-A7TFGW74" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="astro-A7TFGW74">
    <div id="default-carousel" class="relative astro-A7TFGW74" data-carousel="slide">
      <!-- Carousel wrapper -->
      <div class="relative h-56 py-96 overflow-hidden md:h-96 astro-A7TFGW74">
            <!-- Item 1 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/docs.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Tecnica de Hipotermia
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/vasos.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Constricción de los vasos sanguíneos, por las bajas temperaturas
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 3 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/acido-base.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Alteración en el equilibrio ácido-base
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>
        
        <!-- Item 4 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/afeccion.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Afección en la actividad enzimática
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 5 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/membrana.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Alteración en la fluidez de la membrana plasmática
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 6 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/virus.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Los virus se propagan más fácil en temperaturas bajas
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 7 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/regulador.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                El hipotálamo como regulador térmico
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>

        <!-- Item 8 -->
        <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
          <img src="../../public/piloereccion.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
          <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
            <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
              <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
            </div>
            <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
              <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
                Piloerección
              </p>
              <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Item 9 -->
      <div class="hidden duration-1400 ease-in-out astro-A7TFGW74" data-carousel-item>
        <img src="../../public/SAL.png" class="absolute block w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 brightness-50 astro-A7TFGW74" alt="...">
        <div class="relative flex justify-center items-center mx-auto flex-col text-white mt-32 astro-A7TFGW74">
          <div class="w-auto px-24 mx-auto text-center astro-A7TFGW74">
            <p class="font-bold text-2xl uppercase astro-A7TFGW74">#SabiasQue</p>
          </div>
          <div class="w-auto px-24 mx-auto mb-48 mt-40 text-center astro-A7TFGW74">
            <p class="md:text-5xl lg:text-7xl text-4xl pb-12 font-bold astro-A7TFGW74">
              La importancia de la sal (NaCI) en la regulación de la presión arterial
            </p>
            <a href="/sabias" class="transition ease-in-out duration-300 bg-red-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800 astro-A7TFGW74">Conoce mas
            </a>
          </div>
        </div>
      </div>

      <!-- Slider controls -->
      <button type="button" class="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none astro-A7TFGW74" data-carousel-prev>
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none astro-A7TFGW74">
          <svg aria-hidden="true" class="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800 astro-A7TFGW74" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" class="astro-A7TFGW74"></path>
          </svg>
          <span class="sr-only astro-A7TFGW74">Previous</span>
        </span>
      </button>
      <button type="button" class="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none astro-A7TFGW74" data-carousel-next>
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none astro-A7TFGW74">
          <svg aria-hidden="true" class="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800 astro-A7TFGW74" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" class="astro-A7TFGW74"></path>
          </svg>
          <span class="sr-only astro-A7TFGW74">Next</span>
        </span>
      </button>
    </div>
  </div><div class="px-12 pt-24 xl:px-44 xl:pt-32 astro-A7TFGW74" id="conoce-mas">
    <h3 class="text-3xl pb-12 font-bold astro-A7TFGW74">Conoce <span class="text-red-700 astro-A7TFGW74">más</span></h3>
    <div class="flex flex-wrap gap-12 astro-A7TFGW74">

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/acido-base" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/acido2.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/acido-base" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">¿Qué es el equilibrio ácido- base?</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El equilibrio ácido-base es el balance que mantiene el organismo entre ácidos y bases con el objetivo de mantener un pH constante.</p>
            <a href="/acido-base" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas información
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/cuidados" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/cuidados.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/cuidados" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">¿Cómo cuidarte en las bajas temperaturas?</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">Las épocas de frió son muy duras y difíciles para los adultos mayores. Ya que las enfermedades....</p>
            <a href="/cuidados" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas información
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/ph" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/ph.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/ph" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">¿Qué es pH?</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">Se trata de un valor utilizado con él objetivó de medir....</p>
            <a href="/ph" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/celula" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/celula.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/celula" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">¿Qué es la célula?</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">Las células son unidades estructurales y funcionales vivientes rodeadas por una membrana....</p>
            <a href="/celula" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/corazon" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/heart.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/corazon" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">Estructura y Función del corazón</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El corazón bombea sangre a todas las partes del cuerpo. La sangre suministra....</p>
            <a href="/corazon" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/potencial-corazon" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/heart4.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/potencial-corazon" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">Potencial de acción del corazón</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">Conoce las 4 fases....</p>
            <a href="/potencial-corazon" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/sistema-cardio-respiratorio" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/cardio1.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/sistema-cardio-respiratorio" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">¿Qué es el sistema cardio respiratorio?</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El Sistema Cardio-respiratorio es aquel que está formado por dos aparatos bien diferenciados: el Sistema Circulatorio, el cual se encarga de....</p>
            <a href="/sistema-cardio-respiratorio" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/termogenico" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/termo.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/termogenico" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">Termogénico de los alimentos y sin escalofríos</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El efecto termógeno de los alimentos....</p>
            <a href="/termogenico" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/cambio-climatico" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/cambio-climatico.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/cambio-climatico" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">Cambio climático y salud</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El cambio climático son los efectos a largo plazo de las temperaturas y los patrones climáticos. Estos cambios suelen ser....</p>
            <a href="/cambio-climatico" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>

      <div class="max-w-md bg-white rounded-lg border border-gray-200 shadow-md astro-A7TFGW74">
        <a href="/sistema-respiratorio" class="astro-A7TFGW74">
            <img class="rounded-t-lg astro-A7TFGW74" src="../../public/sistema-respiratorio.png" alt="">
        </a>
        <div class="p-5 astro-A7TFGW74">
            <a href="/sistema-respiratorio" class="astro-A7TFGW74">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 astro-A7TFGW74">Sistema respiratorio</h5>
            </a>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 astro-A7TFGW74">El sistema respiratorio es un conjunto anatómico, en el cual participan....</p>
            <a href="/sistema-respiratorio" class="inline-flex items-center py-2 px-6 text-sm font-medium text-center text-white bg-blue-900 rounded-lg hover:bg-blue-600 astro-A7TFGW74">
                Mas informacion
                <svg aria-hidden="true" class="ml-2 -mr-1 w-4 h-4 astro-A7TFGW74" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" class="astro-A7TFGW74"></path></svg>
            </a>
        </div>
      </div>
    </div>
  </div><div class="px-12 py-24 xl:px-44 xl:pt-32 astro-A7TFGW74" id="explora">
    <h3 class="text-3xl pb-12 font-bold astro-A7TFGW74">Explora y <span class="text-red-700 astro-A7TFGW74">aprende</span></h3>
    <div class="flex gap-16 overflow-x-auto astro-A7TFGW74">
      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/xu0oijkhV-A" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/wzryR4PKGpk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/9fxm85Fy4sQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/F4TIx05aBi8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/B7GvvHJQKiE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/JaISgsXU_a4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/uwZhytn71SA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/9YKnMa4Bu2U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/h_0An181E5Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/XPVuEZlscf4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/XPVuEZlscf4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/vO_7bA3fxQk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/jD7S0Kb28ps" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/rQu8DjCdLVA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/I_LYJXrjtVI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>

      <div class="astro-A7TFGW74">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/7eZszeH1gCc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="astro-A7TFGW74"></iframe>
      </div>
      
    </div>
    
  </div>${renderComponent($$result, "Footer", $$Footer, { "class": "astro-A7TFGW74" })}` })}`;
});

const $$file$g = "D:/repos/medicine/src/pages/index.astro";
const $$url$g = "";

const _page0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$g,
	default: $$Index,
	file: $$file$g,
	url: $$url$g
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$f = createMetadata("/D:/repos/medicine/src/pages/sistema-cardio-respiratorio.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$f = createAstro("/D:/repos/medicine/src/pages/sistema-cardio-respiratorio.astro", "", "file:///D:/repos/medicine/");
const $$SistemaCardioRespiratorio = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$f, $$props, $$slots);
  Astro2.self = $$SistemaCardioRespiratorio;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\xBFQu\xE9 es el sistema cardio respiratorio? | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Qué es el sistema cardio respiratorio? 
        </h1>
        <p>El Sistema Cardio-respiratorio es aquel que está formado por dos aparatos bien diferenciados: el Sistema Circulatorio, el cual se encarga de hacer circular la sangre por todo el organismo, y el Aparato respiratorio, cuya función principal es introducir el oxígeno (O2) para que sea distribuido a todo el organismo juntamente con las sustancias nutritivas y eliminar el dióxido de carbono (CO₂).</p>
        <br>
        <p>Ambos aparatos juntos cumplen un funcionamiento vital, el cual es; aportar a las células el oxígeno y los nutrientes necesarios, y eliminar los elementos de desecho junto con el dióxido de carbono (CO₂). (1)</p>
        <br>
        <iframe class="my-16" src="https://app.powerbi.com/view?r=eyJrIjoiNzcwYmVmMzUtNmM5MC00MDgyLTk4MzMtMjcxOGI1YWNlYjZhIiwidCI6IjRhYjExODNlLTc1ZDYtNGI4Ny1iNGI1LWJmY2I5NjhjMWQ1NyIsImMiOjR9" allowfullscreen="allowfullscreen" width="1035" height="700" frameborder="0"></iframe>
        <br>
        <p>Mira la infografia:</p>
        <img src="../../public/cardio2.png" alt="" class="w-full md:w-[60%] my-8 mx-auto">

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Márquez JMC, Celis CC. Temario Resumido de Oposiciones de Educación Física Secundaria (LOMCE) Volumen II: Acceso al cuerpo de profesores de Enseñanza Secundaria. Wanceulen Editorial S.L; 2020.</p>
            <br>
            <p class="italic">
            2. Strempler M. Sistema cardio-respitariorio [Internet]. Disponible en: <span><a class="text-red-900 font-bold" href="https://i.pinimg.com/originals/81/b8/76/81b87683bfe22b5e490c93443b1b914b.jpg">https://i.pinimg.com/originals/81/b8/76/81b87683bfe22b5e490c93443b1b914b.jpg</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$f = "D:/repos/medicine/src/pages/sistema-cardio-respiratorio.astro";
const $$url$f = "/sistema-cardio-respiratorio";

const _page1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$f,
	default: $$SistemaCardioRespiratorio,
	file: $$file$f,
	url: $$url$f
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$e = createMetadata("/D:/repos/medicine/src/pages/sistema-respiratorio.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$e = createAstro("/D:/repos/medicine/src/pages/sistema-respiratorio.astro", "", "file:///D:/repos/medicine/");
const $$SistemaRespiratorio = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$e, $$props, $$slots);
  Astro2.self = $$SistemaRespiratorio;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sistema respiratorio | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Sistema respiratorio
        </h1>
        <p>El sistema respiratorio es un conjunto anatómico, en el cual participan, pulmones, las vas aéreas, parte del sistema nervioso central, los músculos respiratorios y la caja torácica. (1) se conocen dos vías áreas estructuralmente; la vía aérea alta y baja, la vía aérea alta esta constituida por cavidad nasal, faringe y laringe y la vía aérea baja está constituida por árbol traqueobronquial, bronquios y alveolos. (2)
        </p>
        <br>
        <p>La función principal es el intercambio gaseoso, aunque también contribuye al mantenimiento del equilibrio ácido-base, la fonación, la defensa frente a agentes nocivos del aire ambiental y diversas funciones metabólicas. (1)
        </p>
        <br>

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Vía aérea superior</h1>
        <br>
        <p>Vía aérea superior es de vital importancia ya que gracias a ella se evita la entrada de materiales extraños en el árbol traqueobronquial, esta participa en funciones de fonación y olfatorio. (2)
        </p>
        <br>
        <p>La nariz filtra, humificar y calienta el aire inspirado. Faringe, esta se divide en tres partes, nasofaringe, orofaringe y laringofaringe.</p>
        <br>

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Vía área inferior</h1>
        <br>
        <p>Laringe, esta participa en la fonación, pero también desempeña una función importante en la protección frente a la aspiración de olidos y líquidos.</p>
        <br>
        <p>El interior de la laringe se encuentra tapizado por una membrana mucosa que forma dos pares de pliegues que protruyen en su interior. Los superiores son las cuerdas vocales falsas, pues no tienen función alguna en la fonación. Los inferiores son las cuerdas vocales verdaderas. El espacio que limita ambas cuerdas se denomina glotis. Las cuerdas se abren durante la inspiración profunda y tienden a cerrarse en la espiración, aunque persiste cierta abertura de la glotis. La laringe también tiene una importante función en la maniobra de la tos. (2)
        </p>

        <h3 class="text-md font-extrabold my-auto pt-12 uppercase text-left">Árbol traqueobronquial</h3>
        <br>
        <p>Es un conjunto de vías ramificadas que conducen el aire inspirado hasta las unidades respiratorias terminales. Se distinguen dos grandes zonas: de conducción y respiratoria. En la primera se distinguen vías aéreas cartilaginosas y no cartilaginosas. Son vías cartilaginosas la tráquea y los bronquios principales, lobares, segmentarios y subsegmentarios, en tanto que los bronquíolos y los bronquíolos terminales son vías no cartilaginosas. (2)
        </p>
        <br>
        <p>El epitelio del tracto respiratorio tiene diversos tipos de células especializadas, Inicialmente es un epitelio pseudo estratificado que se transforma hacia distal en uno coloidal para finalmente terminar siendo escamoso. Las células caliciformes producen la mucina (glicoproteínas ácidas) que constituye el mucus de la vía aérea, principalmente en tráquea y bronquios. Las células epiteliales no ciliadas aparecen en los bronquiolos, secretan proteínas del surfactante, lípidos, glicoproteínas y moduladores de inflamación. Además, son progenitoras de otras células no ciliadas y ciliadas, metabolizan material extraño y participan del balance de fluido de la vía aérea. El epitelio respiratorio está recubierto por cilios, en su parte superior, se conoce como la zona apical de las células, la función de estos cilios es movilizar el mucus desde la vía aérea distal hasta la faringe. (1)
        </p>
        <br>
        <img src="../../public/resp.png" alt="" class="w-full md:w-[40%] my-8 mx-auto">

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Bronquios</h1>
        <br>
        <p>Son conductos que permiten el pasaje del aire hacia los pulmones, estos se empiezan a ramificar desde la tráquea, hay bronquios principales, secundarios y bronquios terciarios (segmentarios) estos se dividen en muchos bronquiolos más pequeños que se ramifican en bronquiolos terminales y luego en bronquiolos respiratorios; a su vez, estos se dividen en 2 a 11 conductos alveolares. Cada conducto alveolar tiene 5 o 6 sacos alveolares asociados. El alvéolo es la unidad anatómica básica en donde ocurre el intercambio de gases. (3)</p>
        <br>

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Enfermedades relacionadas con este sistema</h1>
        <br>
        <p>Asma, infecciones respiratorias, atelectasias e insuficiencia respiratoria, EPOC, entre otras, claramente las temperaturas harán que las personas que tengan este tipo de enfermedades puedan empeorar, por el caso de las muy bajas temperaturas, ya que estas en vez de ayudar a el paciente, lo genera es una dificultad mayor para poder respirar.</p>
        <br>

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Como se da el intercambio gaseoso</h1>
        <br>
        <p>Los movimientos tanto de O2 como de CO2 a través de la barrera hematoalveolar se producen mediante difusión simple. Para esto, debe ocurrir una adecuada difusión de gases en la membrana alveolocapilar, proceso pasivo en el que el oxígeno se mueve hacia el capilar y el dióxido de carbono hacia el alveolo. Las características únicas de la membrana alveolocapilar favorecen la difusión de gases, pero es el gradiente de presión parcial de los gases el principal determinante. El oxígeno pasa fácilmente por la membrana alveolocapilar y se une rápidamente a la hemoglobina, saturándola, cuando se iguala la presión parcial de oxígeno alveolar y la capilar se detiene la difusión de este gas; por lo que la difusión de oxígeno en reposo está limitada por perfusión. La difusión del oxígeno es más lenta que la del dióxido de carbono debido a su menor solubilidad. En condiciones patológicas tanto el oxígeno como el dióxido de carbono pueden ser limitados por difusión (2).</p>
        <br>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic pb-6">
                1.	Barberá JA. Estructura y función del aparato respiratorio [Internet]. Mhmedical.com. [citado el 30 de octubre de 2022]. Disponible en:
                <span><a class="text-red-900 font-bold" href="https://accessmedicina.mhmedical.com/content.aspx?bookid=1858&sectionid=134367197">https://accessmedicina.mhmedical.com/content.aspx?bookid=1858&sectionid=134367197</a></span>
            </p>
            <p class="italic pb-6">
                2.	Vista de ESTRUCTURA Y FUNCIONES DEL SISTEMA RESPIRATORIO [Internet]. Neumologia-pediatrica.cl. [citado el 30 de octubre de 2022]. Disponible en: 
                <span><a class="text-red-900 font-bold" href="https://neumologia-pediatrica.cl/index.php/NP/article/view/212/203">https://neumologia-pediatrica.cl/index.php/NP/article/view/212/203</a></span>
            </p>
            <p class="italic pb-6">
                3.  Vélez J, Laguna M. Bronquiolos y alvéolos. 2022.
                <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=rQu8DjCdLVA&ab_channel=Chemy">https://www.youtube.com/watch?v=rQu8DjCdLVA&ab_channel=Chemy</a></span>
            </p>
            <p class="italic pb-6">
                4.  IMAGEN (29) D. ¡FORORO! Rico alimento aunque peligroso — [Internet]. Steemit. 2019 [citado el 30 de octubre de 2022]. Disponible en:
                <span><a class="text-red-900 font-bold" href="https://steemit.com/spanish/@delubi/fororo-rico-alimento-aunque-peligroso">https://steemit.com/spanish/@delubi/fororo-rico-alimento-aunque-peligroso</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$e = "D:/repos/medicine/src/pages/sistema-respiratorio.astro";
const $$url$e = "/sistema-respiratorio";

const _page2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$e,
	default: $$SistemaRespiratorio,
	file: $$file$e,
	url: $$url$e
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$d = createMetadata("/D:/repos/medicine/src/pages/potencial-corazon.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$d = createAstro("/D:/repos/medicine/src/pages/potencial-corazon.astro", "", "file:///D:/repos/medicine/");
const $$PotencialCorazon = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$d, $$props, $$slots);
  Astro2.self = $$PotencialCorazon;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Potencial de acci\xF3n del coraz\xF3n | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Potencial de acción del corazón</h1>
        <p><span class="font-bold">Fase 1: </span>Repolarización, se da cuando los canales de sodio rápidos se cierran. Al cerrarse, la célula empieza a repolarizar y los iones de potasio salen de la célula a través de los canales de potasio.</p>
        <br>
        <p><span class="font-bold">Fase 2 (meseta): </span> Los canales de calcio se abren y los canales de potasio rápidos se cierra. Se da lugar a una breve repolarización inicial y el potencial de acción alcanza una mesera como consecuencia de: 1) una mayor permeabilidad de los iones calcio, y 2) la disminución de la permeabilidad de los iones potasios.</p>
        <br>
        <p>Canales de calcio activados por el voltaje se abren lentamente durante la fase 1 y 0, y así ingresa a la célula. Después, los canales de potasio se cierran, y la combinación de una reducción en la salida de iones potasio y un aumento de la entrada de los iones calcio genera que el potencial de acción alcance una meseta.</p>
        <br>
        <p><span class="font-bold">Fase 3: </span> Se da una repolarización rápida, canales de calcio se cierra y los de potasio se abren lento. El cierre de los canales de calcio da la permeabilidad a los iones potasio, que permiten que los iones de potasio salgan rápidamente de la célula, poniendo fin a la meseta y devuélvele el potencial de la membrana celular a su nivel de reposo.</p>
        <br>
        <p><span class="font-bold">Fase 4: </span> Potencial de membrana en reposos con un valor de -90 mV</p>
        <img src="../../public/heart3.png" alt="" class="w-full md:w-[30%] my-8 mx-auto">

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Hall JE. Guyton y Hall. Tratado de Fisiología Médica + Studentconsult. 12a ed. Elsevier; 2016.</p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$d = "D:/repos/medicine/src/pages/potencial-corazon.astro";
const $$url$d = "/potencial-corazon";

const _page3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$d,
	default: $$PotencialCorazon,
	file: $$file$d,
	url: $$url$d
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$c = createMetadata("/D:/repos/medicine/src/pages/cambio-climatico.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$c = createAstro("/D:/repos/medicine/src/pages/cambio-climatico.astro", "", "file:///D:/repos/medicine/");
const $$CambioClimatico = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$c, $$props, $$slots);
  Astro2.self = $$CambioClimatico;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\xBFQu\xE9 es la c\xE9lula? | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Qué es el cambio climático?</h1>
        <p>El cambio climático son los efectos a largo plazo de las temperaturas y los patrones climáticos. Estos cambios suelen ser naturales, pero desde el siglo XIX, por causa de actividades humanas, éstas se volvieron el principal motor del cambio climático, debido principalmente a la quema de combustibles fósiles, como el carbón, el petróleo y el gas, lo que produce gases que atrapan el calor, dichos gases anterior mente afectan la capa de ozono haciendo que los rayos gama del sol puedan entrar más fácil a la atmósfera y causar alteraciones en el planeta (1).</p>
        <br>
        <h1 class="text-md md:text-2xl font-extrabold my-auto py-12 uppercase text-left">¿Cómo el cambio climático afecta a la salud?</h1>
        <p>Según la OMS El cambio climático afecta de muchas maneras la salud, como, por ejemplo, provocando muertes y enfermedades por fenómenos meteorológicos extremos cada vez más frecuentes, como olas de calor, tormentas e inundaciones, la alteración de los alimentarios, el aumento de las zoonosis (zoonosis es un grupo de enfermedades que los animales pueden trasmitirle a los seres humanos) y las enfermedades transmitidas por los alimentos, el agua y los vectores, y los problemas de salud mental. (2)</p>
        <br>
        <img src="../../public/cambio2.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">¿Como podemos mitigar el calentamiento global?</h1>
        <br>
        <ul class="pl-8">
            <li><span class="font-bold text-red-900">1.</span>  Ahorrar energía en el hogar.</li>
            <li><span class="font-bold text-red-900">2.</span>  Desplazarse por bicicleta, caminata o trasporte público.</li>
            <li><span class="font-bold text-red-900">3.</span>  Reduzca, reutilice, repare y recicle.</li>
            <li><span class="font-bold text-red-900">4.</span>  Reforestación.</li>
            <li><span class="font-bold text-red-900">5.</span>  Ahorro de agua.</li>
        </ul>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
                1. United Nations. ¿Qué es el cambio climático? | Naciones Unidas. [citado el 30 de octubre de 2022]; Disponible en: <span><a class="text-red-900 font-bold" href="https://www.un.org/es/climatechange/what-is-climate-change">https://www.un.org/es/climatechange/what-is-climate-change</a></span>
            </p>
            <br>
            <p class="italic">
                2. Figueroa R. Cambio climático y salud. Rev Peru Med Exp Salud Publica [Internet]. 2016 [citado el 30 de octubre de 2022];33(1):7. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.who.int/es/news-room/fact-sheets/detail/climate-change-and-health">https://www.who.int/es/news-room/fact-sheets/detail/climate-change-and-health</a></span>
            </p>
            <br>
            <p class="italic">
                3. United Nations. Actúa ahora | Naciones Unidas. [citado el 30 de octubre de 2022]; Disponible en: <span><a class="text-red-900 font-bold" href="https://www.un.org/es/actnow">https://www.un.org/es/actnow</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$c = "D:/repos/medicine/src/pages/cambio-climatico.astro";
const $$url$c = "/cambio-climatico";

const _page4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$c,
	default: $$CambioClimatico,
	file: $$file$c,
	url: $$url$c
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$b = createMetadata("/D:/repos/medicine/src/pages/latam-europa.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$b = createAstro("/D:/repos/medicine/src/pages/latam-europa.astro", "", "file:///D:/repos/medicine/");
const $$LatamEuropa = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
  Astro2.self = $$LatamEuropa;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Latinoamerica y Europa | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="w-screen h-72" style="background-image: url('https://images.unsplash.com/photo-1624324378932-68e20f332982?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'); background-repeat: no-repeat; background-size: cover; background-position:center;">
  </div><div class="px-0 md:px-56">
    <div class="h-[120vh]">
      <div class="grid-rows-1 absolute mx-auto h-[60rem] md:inset-5 md:top-[40%] w-screen xl:w-[80%] 2xl:w-[70%] px-0 lg:px-16">
        <div class="relative">
          <!-- Slide 1 -->
          <div class="text-justify bg-white px-8 md:px-24 xl:px-32 pb-32" id="page1">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">Bajas temperaturas en Latinoamerica y Europa</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">AMERICA LATINA Y EL MUNDO RESPECTO AL CAMBIO CLIMATICO Y BAJAS TEMPERATURAS</h1>
            <p>Numerosos estudios han relacionado la exposición a temperaturas frías con un aumento de la mortalidad. En una investigación realizada en 13 países, los autores concluyen que un 7% de la mortalidad se debe al frío. En el caso de España, país incluido en este estudio, el frío es responsable del 5,5% de las muertes registradas. Las causas de muerte más relacionadas con el frío son las enfermedades respiratorias y cardiovasculares, pero también la diabetes o las enfermedades mentales. Los episodios de frío extremo son también responsables del aumento en las hospitalizaciones, sobre todo por causas respiratorias y cardiovasculares.</p>
            <br>
            <p>Pero no todo mundo padece los efectos nocivos del frío de la misma manera. La gente mayor es uno de los colectivos más vulnerables, tanto por sus condiciones físicas como por el hecho de que frecuentemente padecen de otras enfermedades. También es habitual que el consumo de medicamentos en estas personas altere los mecanismos que regulan la temperatura del cuerpo. Un estudio realizado en Barcelona detectó un aumento de 25% en la mortalidad de personas mayores de 65 años en los días en que se registran temperaturas bajas además el nivel del mar está aumentando, los glaciares se están fundiendo y los regímenes de lluvias están cambiando. Los fenómenos meteorológicos extremos son cada vez más intensos y frecuentes.</p>
            <br>
            <img src="../../public/frio-salud.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
            <!-- <p class="italic opacity-40">Cambio climático global y algunos efectos (observados y esperados) (Fuente: IPCC, 2014).</p> -->
            <br>
            <p>La OPS: en américa latina y el caribe es constante el aumento de las enfermedades crónicas no transmisibles por diversos factores como la disparidad socioeconómica de la región, los constantes malos hábitos en el estilo de vida, junto con el envejecimiento la globalización , han llevado a que las enfermedades cardiovasculares sean una de las principales causas de mortalidad y discapacidad en esta región, por diversos estudios de esta organización se ve una clara prevalencia de la mortalidad en países pobres de la región, también deja ver que de las principales enfermedades cardiacas con mayor mortalidad son <span class="font-bold">Cardiopatía isquémica: 73,6 muertes por 100.000 habitantes</span></p>
            <br>
            <ul class="list-disc pl-24">
                <li>Accidente cerebrovascular: 32.3</li>
                <li>Otras enfermedades circulatorias: 14,8</li>
                <li>Enfermedad cardíaca hipertensiva: 10.6</li>
                <li>Miocardiopatía, miocarditis, endocarditis: 5.1</li>
                <li>Cardiopatía reumática: 0.7</li>
            </ul>
            <br>
            <p>OPS. La carga de las enfermedades cardiovasculares en la Región de las Américas, 2000-2019. Portal de Datos de NMH. Organización Panamericana de la Salud; 2021.</p>
            <br>
            <p>Según la OMS las enfermedades cardiovasculares son la principal causa de muerte en el mundo y cerca del 90% de estas muertes se dan por accidentes cardio vasculares y cardiopatías crónicas. en Europa las enfermedades cardiovasculares son las causantes de aproximadamente la mitad de las muertes en Europa.</p>
            <br>
            <p>según el servicio meteorológico nacional de argentina por diversos estudios en estados unidos y Europa han encontrado que ahi una relación inversa entre las muertes por causas naturales y las temperaturas bajas, pero un incremento en la mortalidad de las enfermedades respiratorias, cardiovasculares y cerebrovasculares. <span><a class="text-red-900 font-bold" href="http://200.16.116.28/handle/20.500.12160/1839">Repositorio Institucional</a></span></p>
            <br>
            <p>Según la OMS las enfermedades cardiovasculares son la principal causa de muerte en el mundo y cerca del 90% de estas muertes se dan por accidentes cardio vasculares y cardiopatías crónicas. en Europa las enfermedades cardiovasculares son las causantes de aproximadamente la mitad de las muertes en Europa.</p>
            <br>
            <p>El Servicio Meteorológico Nacional alemán informó de que, la semana pasada, en dos días cayeron precipitaciones equivalentes a dos meses sobre suelos que ya estaban cerca de la saturación en las regiones más afectadas del país, así como en Bélgica, Países Bajos y Luxemburgo. Suiza y Austria también sufrieron graves inundaciones. 

                Según ese Servicio, entre el 14 y el 15 de julio cayeron entre 100 y 150 mm de precipitaciones en 24 horas. La estación meteorológica de Wipperfuerth-Gardeweg registró 162 mm, seguida de Colonia-Stammheim con 160 mm, Kall-Sistig con 152 mm y Wuppertal-Buchenhofen con 151 mm.  
                
                En otra parte del planeta, algunas zonas de la provincia central china de Henan recibieron entre el 17 y el 21 de julio más precipitaciones que la media anual. La estación nacional de observación meteorológica de Zhengzhou alcanzó los 720 mm, frente a su media anual de 641 mm. 
                
                Zhengzhou, la capital de Henan, recibió una cantidad de lluvia equivalente a la mitad de su precipitación anual en seis horas. en ese tiempo, cayeron 382 mm de agua y de las 16:00 a las 17:00 horas del 20 de julio, la precipitación en Zhengzhou superó los 200 mm. 
                
                Más de 600 estaciones registraron lluvias superiores a los 250mm. La precipitación máxima fue de 728mm. El Servicio Meteorológico de Henan puso en marcha la respuesta de emergencia de más alto nivel para hacer frente a las inundaciones. 
                
                En Europa, las 1672 catástrofes registradas entre 1970 y 2019 provocaron159.438 muertes y 476.500 millones de dólares en daños económicos. Aunque las inundaciones y las tormentas fueron las catástrofes más frecuentes, las temperaturas extremas dejaron el mayor número de víctimas mortales con 148.109 vidas perdidas en 50 años. 
                
                Las dos olas de calor extremas de 2003 y 2010 fueron las más mortales, con 127.946 víctimas. La ola de calor de 2003 fue responsable de la mitad de las muertes en Europa, con un total de 72.210 muertes en los 15 países afectados, según uno de los capítulos del próximo Atlas. 
                
                El Atlas de la OMM sobre mortalidad y pérdidas económicas debidas a fenómenos meteorológicos, climáticos e hidrológicos extremos (1970-2019) se publicará antes de la <span><a class="text-red-900 font-bold" href="https://www.un.org/es/ga/about/index.shtml">Asamblea General</a></span> de las Naciones Unidas de septiembre. 
                
                El Atlas forma parte de una serie de iniciativas de la Organización Meteorológica Mundial destinadas a proporcionar a los responsables de la toma de decisiones información con base científica sobre los fenómenos meteorológicos y climáticos extremos, y el estado del clima mundial. </p>

            <h2 class="text-xl md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Latinoamerica frente al cambio climatico</h2>

            <iframe class="mt-16 mx-auto max-w-full" width="560" height="315" src="https://www.youtube.com/embed/xUxShiRies4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

            <h2 class="text-xl md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Europa frente al cambio climatico</h2>

            <iframe class="mt-16 mx-auto max-w-full" width="560" height="315" src="https://www.youtube.com/embed/rfb-u2D-Y30" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

            <!-- <div class="grid grid-rows-2 mt-16">
                <h1 class="sm:text-lg md:text-1xl font-extrabold my-auto uppercase text-left">Mira los PDF:</h1>
                <div class="flex flex-col">
                    <a href="http://www.ideam.gov.co/documents/10182/511760/Indice+de+Confort+Termico+Periodo+2011-2040.pdf/37b6bddd-a089-4478-9a40-a05a42f93c0a?version=1.0" class="border-4 px-4 py-2 border-black font-bold">Temperatura Media Período 1976-2005</a>
                    <a href="http://www.ideam.gov.co/documents/10182/511760/Temperatura+Media+%28%C2%B0C%29+para+el+Periodo+1976-2005.pdf/7b3f897b-b010-4a18-bc34-985f6b4d592d?version=1.0" class="border-4 px-4 py-2 border-black font-bold mt-4">Índice de Confort Térmico   Período 2011-2040</a>
                </div>
            </div> -->

            <div class="mt-24 opacity-60 w-full">
              <p class="italic">
                1. Dic 9. La OMS revela las principales causas de muerte y discapacidad en el mundo: 2000-2019 [Internet]. Paho.org. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019">https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019</a></span>
              </p>
              <br>
              <p class="italic">
                2. Semana. ¿Cómo está el corazón de los colombianos? [Internet]. Semana.com Últimas Noticias de Colombia y el Mundo. 2020 [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/">https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/</a></span>
              </p>
              <br>
              <p class="italic">
                3. Diciembre BDC. Boletines Poblacionales 1 : Personas Adultas Mayores de 60 años Oficina de Promoción Social Ministerio de Salud y Protección Social I-2020 [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf">https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf</a></span>
              </p>
              <br>
              <p class="italic">
                4. Colombia frente al calentamiento global - Universidad del Rosario [Internet]. Edu.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/">https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/</a></span>
              </p>
              <br>
              <p class="italic">
                5. Cambio Climático - IDIGER [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.idiger.gov.co/rcc">https://www.idiger.gov.co/rcc</a></span>
              </p>
              <br>
              <p class="italic">
                6. ¿Qué efectos tiene el frío sobre nuestra salud? - Blog [Internet]. ISGlobal. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0">https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0</a></span>
              </p>
              <br>
              <p class="italic">
                7.  Ministerio de Ambiente Y Desarrollo Sostenible. Colombia CSHAPCM. ¿QUÉ ES EL CAMBIO CLIMÁTICO Y CÓMO AFECTA A COLOMBIA? [Internet]. Colombia: Fundacion accion solidaria; 13/oct/2016. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria">https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria</a></span>
              </p>
              <br>
              <p class="italic">
                8. IDEAM. TEMPERATURA MEDIA (°C) PARA EL PERIODO 1976-2005 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold" href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900954">See details</a></span>
              </p>
              <br>
              <p class="italic">
                9. IDEAM. Índice de Confort Térmico   Período 2011-2040 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold" href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900863">See details</a></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>` })}`;
});

const $$file$b = "D:/repos/medicine/src/pages/latam-europa.astro";
const $$url$b = "/latam-europa";

const _page5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$b,
	default: $$LatamEuropa,
	file: $$file$b,
	url: $$url$b
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$a = createMetadata("/D:/repos/medicine/src/pages/termogenico.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$a = createAstro("/D:/repos/medicine/src/pages/termogenico.astro", "", "file:///D:/repos/medicine/");
const $$Termogenico = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$Termogenico;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Termog\xE9nico de los alimentos y sin escalofr\xEDos | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Termogénico de los alimentos y sin escalofríos. 
        </h1>
        <p>Después de ingerir alimentos, nuestra tasa metabólica aumenta, debido a las distintas reacciones químicas que acompañan el proceso de la digestión, absorción y almacenamiento de los alimentos dentro del organismo, a esto se le denomina el efecto termógeno de los alimentos, puesto que se requiere energía para estos procesos y se genera calor. El efecto termógeno de los alimentos explica el 8% del consumo energético diario de muchas personas (1).</p>
        <br>
        <p>La tiritona supone un medio para generar calor basado en una actividad muscular como respuesta al frío, pero existe otro mecanismo, el de la termogénica sin tiritona, el cual genera calor como respuesta al frío. Este se estimula con la activación del sistema nervioso simpática, el cual libera noradrenalina y adrenalina que, a su vez, aumentan la actividad metabólica y la producción de calor. Gracias a esta estimulación simpática índice a la liberación de cantidades grandes de calor, por parte de algunos tejidos grasos, como el de grasa parda, este tipo de grasa contiene muchas mitocondrias, la fosforilación oxidativa de las mitocondrias de estas células es fundamentalmente desacoplada, es decir que los nervios simpáticos estimularan a estas células, generando que las mitocondrias produzcan mucho calor, pero poco ATP. De este modo, toda la energía oxidativa liberada se transforma en calor (1).</p>
        <img src="../../public/termo2.png" alt="" class="w-full md:w-[30%] my-8 mx-auto">

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Hall JE. Guyton y Hall. Tratado de Fisiologia Medica + Studentconsult. 12a ed. Elsevier; 2016.</p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$a = "D:/repos/medicine/src/pages/termogenico.astro";
const $$url$a = "/termogenico";

const _page6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$a,
	default: $$Termogenico,
	file: $$file$a,
	url: $$url$a
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$9 = createMetadata("/D:/repos/medicine/src/pages/acido-base.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$9 = createAstro("/D:/repos/medicine/src/pages/acido-base.astro", "", "file:///D:/repos/medicine/");
const $$AcidoBase = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$AcidoBase;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Equilibrio \xE1cido-base | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Qué es el equilibrio ácido- base?</h1>
        <p>El equilibrio ácido-base es el balance que mantiene el organismo entre ácidos y bases con el objetivo de mantener un pH constante</p>
        <br>
        <p>¿Qué es el equilibrio ácido- base? Es el balance que mantiene el organismo, entre ácidos y bases, en el objetivo de mantener el pH constante y en los rangos adecuados; queremos que lo entiendas mucho mejor por eso te dejamos una imagen ilustrada que lo explica un poco mejor y más a fondo, para que lo tengas en cuenta y veas la importancia de mantener un pH balanceado. (1)</p>
        <br>
        <img src="../../public/acido.png" alt="" class="w-full md:w-[30%] my-8">

        <iframe class="mt-16 mx-auto max-w-full" width="560" height="315" src="https://www.youtube.com/embed/HHNtSV-vSAQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Equilibrio Ácido Base, mantén un pH constante evitando sus alteraciones [Internet]. Laboratorio Cobas. 2018 [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://laboratoriocobas.com/equilibrio-acido-base/">https://laboratoriocobas.com/equilibrio-acido-base/</a></span>
            </p>
            <br>
            <p class="italic">
            2. RadiometerMedical. Cómo entender el equilibrio ácido-base [Internet]. Youtube; 2017 [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=HHNtSV-vSAQ">https://www.youtube.com/watch?v=HHNtSV-vSAQ</a></span>
            </p>
            <br>
            <p class="italic">
            3. IMAGEN 1 Facebook [Internet]. Facebook.com. [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://web.facebook.com/LuzMedicaMX/posts/1234177960266361/">https://web.facebook.com/LuzMedicaMX/posts/1234177960266361/</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$9 = "D:/repos/medicine/src/pages/acido-base.astro";
const $$url$9 = "/acido-base";

const _page7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$9,
	default: $$AcidoBase,
	file: $$file$9,
	url: $$url$9
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$8 = createMetadata("/D:/repos/medicine/src/pages/colombia.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$8 = createAstro("/D:/repos/medicine/src/pages/colombia.astro", "", "file:///D:/repos/medicine/");
const $$Colombia = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Colombia;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Frio en Colombia | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="w-screen h-72" style="background-image: url('https://images.unsplash.com/photo-1623167987983-722c1b1fe790?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80'); background-repeat: no-repeat; background-size: cover; background-position:bottom;">
  </div><div class="px-0 md:px-56">
    <div class="h-[120vh]">
      <div class="grid-rows-1 absolute mx-auto h-[60rem] md:inset-5 md:top-[40%] w-screen xl:w-[80%] 2xl:w-[70%] px-0 lg:px-16">
        <div class="relative">
          <!-- Slide 1 -->
          <div class="text-justify bg-white px-8 md:px-24 xl:px-32 pb-32" id="page1">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">Bajas temperaturas en Colombia</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">EL CAMBIO CLIMÁTICO Y LAS BAJAS TEMPERATURAS EN COLOMBIA</h1>
            <p>Como sabemos la temperatura hace parte importante de como el individuo vive y se desenvuelve, pero también hemos podido observar durante los años el cambio que ha tenido este, es decir la temperatura y como puede ser un factor para generar o propagar más enfermedades; con todo esto queremos hablar de como las temperaturas bajas afectan las condiciones de los colombiano en este caso, ya que el frio no es malo, pero los cambios que está sufriendo el planeta, generar alteraciones en este equilibrio, además la cantidad de enfermedades cardiovasculares y respiratorias que viven los colombianos. Según la Organización Mundial de la Salud (OMS), las enfermedades cardiovasculares son la principal causa de muerte en todo el mundo. Cifras de la Organización indican que en el año 2015 murieron por esta causa 17,7 millones de personas, lo cual representa un 31 por ciento de todas las muertes registradas. A su vez, proyectan que para el año 2030 cerca de 23,6 millones de personas morirán por alguna enfermedad cardiovascular, principalmente por cardiopatías y accidentes cerebrovasculares (1).</p>
            <br>
            <p>En Colombia, los datos más recientes del Departamento Administrativo Nacional de Estadística (DANE) revelan que de las 242.609 muertes registradas en 2019, 55.000 fueron causadas por enfermedades cardiovasculares.(2) Además Es importante mencionar los diagnósticos relacionados con enfermedades del sistema respiratorio, debido a la contingencia del coronavirus Covid -19, que dentro de los adultos mayores representaron el 5,2%, ubicándose en un séptimo lugar por orden de frecuencias, mientras que a nivel de la población general dichos diagnósticos se ubicaron en el sexto lugar con una participación del 7,9% dentro del total, y no solo relacionadas a Covid, sino también  bronquitis no especificada como aguda o crónica, bronquitis crónica simple y mucopurulenta, bronquitis crónica no especificada, enfisema, enfermedad pulmonar obstructiva crónica, estado asmático, y bronquiectasia (3).</p>
            <br>
            <img src="../../public/cambio.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
            <p class="italic opacity-40">Cambio climático global y algunos efectos (observados y esperados) (Fuente: IPCC, 2014).</p>
            <br>
            <p>El cambio climático está generando cambios abruptos en todo el mundo, pero también en Colombia, afectando no solo el ganado, población, tierra y entre otros. Claramente afectado la salud, al haber en zonas montañosas menos cantidad de árboles, se pierde la producción de O2 el cual es de vital importancia para procesos metabólicos y sobre todo la respiración, el oxígeno es vida y lo estamos perdiendo; La tala de árboles en Colombia tiene, por lo general, el propósito de introducir ganado, lo cual añade más GEI, pues los eructos de las vacas son altamente contaminantes porque el proceso de fermentación en sus estómagos genera metano, gas que es 25 veces más potente en términos de calentamiento global que el dióxido de carbono CO2. Según la FAO, el ganado es el responsable de 2/3 de las emisiones globales de efecto invernadero y del 78% de las emisiones de metano (4); Sabiendo bien que al haber más producción de CO2 el cual en nuestro organismo es de carácter acido, generara acidosis respiratorias, afectando y generando asi más morbilidades respiratorias.</p>
            <br>
            <p>Las altas temperaturas que estamos observado, también han generado incendios en bosques, y entre otros recursos naturales los cuales están también afectado de manera respiratoria a la población colombiana y no solo los incendios, sino también las industrias; según un estudio publicado por la Alcaldía mayor de Bogotá afirmando que ‘’el aumento de enfermedades respiratorias por aire contaminado por partículas suspendidas, de polvo e incendios forestales’’ teniendo un riesgo denominado medio, pero el cual puede verse a medida del tiempo; y no solo esto asi como muchas partes de Colombia ahora están más elevadas de temperaturas asi mismo hay otras donde las lluvias son imparables, generando en zonas de frio más resguardo en lugares cerrados para aguardarse de la lluvia y de las bajas temperaturas que genera esta, permitiendo asi la propagación de virus, como rinovirus o entre otros de una manera mucho más fácil, ya que las baja temperaturas son un factor claro y clave para la fácil propagación de virus (5), cuando nos exponemos a bajas temperaturas nuestro organismo por medio del hipotálamo trata de mantener  en temperatura estable (proceso denominado termorregulación) para mantener un equilibrio homeostático; algunos de estos cambios por la temperatura baja son como la viscosidad de la sangre, aumento de la presión arterial y el ritmo cardiaco, entre otros. Todo esto añade un estrés al cuerpo que puede provocar graves problemas de salud en las personas más vulnerables. (6)</p>

            <iframe class="mt-16 mx-auto max-w-full" width="560" height="315" src="https://www.youtube.com/embed/d-b03pFg7UA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

            <div class="grid grid-rows-2 mt-16">
                <h1 class="sm:text-lg md:text-1xl font-extrabold my-auto uppercase text-left">Mira los PDF:</h1>
                <div class="flex flex-col">
                    <a href="http://www.ideam.gov.co/documents/10182/511760/Indice+de+Confort+Termico+Periodo+2011-2040.pdf/37b6bddd-a089-4478-9a40-a05a42f93c0a?version=1.0" class="border-4 px-4 py-2 border-black font-bold">Temperatura Media Período 1976-2005</a>
                    <a href="http://www.ideam.gov.co/documents/10182/511760/Temperatura+Media+%28%C2%B0C%29+para+el+Periodo+1976-2005.pdf/7b3f897b-b010-4a18-bc34-985f6b4d592d?version=1.0" class="border-4 px-4 py-2 border-black font-bold mt-4">Índice de Confort Térmico   Período 2011-2040</a>
                </div>
            </div>

            <div class="mt-24 opacity-60 w-full">
              <p class="italic">
                1. Dic 9. La OMS revela las principales causas de muerte y discapacidad en el mundo: 2000-2019 [Internet]. Paho.org. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019">https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019</a></span>
              </p>
              <br>
              <p class="italic">
                2. Semana. ¿Cómo está el corazón de los colombianos? [Internet]. Semana.com Últimas Noticias de Colombia y el Mundo. 2020 [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/">https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/</a></span>
              </p>
              <br>
              <p class="italic">
                3. Diciembre BDC. Boletines Poblacionales 1 : Personas Adultas Mayores de 60 años Oficina de Promoción Social Ministerio de Salud y Protección Social I-2020 [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf">https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf</a></span>
              </p>
              <br>
              <p class="italic">
                4. Colombia frente al calentamiento global - Universidad del Rosario [Internet]. Edu.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/">https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/</a></span>
              </p>
              <br>
              <p class="italic">
                5. Cambio Climático - IDIGER [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.idiger.gov.co/rcc">https://www.idiger.gov.co/rcc</a></span>
              </p>
              <br>
              <p class="italic">
                6. ¿Qué efectos tiene el frío sobre nuestra salud? - Blog [Internet]. ISGlobal. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0">https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0</a></span>
              </p>
              <br>
              <p class="italic">
                7.  Ministerio de Ambiente Y Desarrollo Sostenible. Colombia CSHAPCM. ¿QUÉ ES EL CAMBIO CLIMÁTICO Y CÓMO AFECTA A COLOMBIA? [Internet]. Colombia: Fundacion accion solidaria; 13/oct/2016. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria">https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria</a></span>
              </p>
              <br>
              <p class="italic">
                8. IDEAM. TEMPERATURA MEDIA (°C) PARA EL PERIODO 1976-2005 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold" href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900954">See details</a></span>
              </p>
              <br>
              <p class="italic">
                9. IDEAM. Índice de Confort Térmico   Período 2011-2040 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold" href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900863">See details</a></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>` })}`;
});

const $$file$8 = "D:/repos/medicine/src/pages/colombia.astro";
const $$url$8 = "/colombia";

const _page8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$8,
	default: $$Colombia,
	file: $$file$8,
	url: $$url$8
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$7 = createMetadata("/D:/repos/medicine/src/pages/cuidados.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$7 = createAstro("/D:/repos/medicine/src/pages/cuidados.astro", "", "file:///D:/repos/medicine/");
const $$Cuidados = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Cuidados;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\xBFC\xF3mo cuidarte en las bajas temperaturas? | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Cómo cuidarte en las bajas temperaturas?</h1>
        <p>Las épocas de frió son muy duras y difíciles para los adultos mayores. Ya que las enfermedades no transmisibles como EPOC o enfermedades cardiovasculares, en estas épocas de frió generan que estas sean mas sensibles a empeorar, por ello siempre a los adultos que sufren de estas los mandan a mudarse a lugares más cálidos, pero claro esto no es muy fácil; por esto queremos darte unos consejos de que hacer para cuidar tu salud en estas épocas de muy bajas temperaturas. (1)</p>
        <br>
        <img src="../../public/cuidad.png" alt="" class="w-full md:w-[40%] my-8 mx-auto">
        <div class="ml-24">
            <ul>
                <li>1.    Tratar de mantener tu hogar entre 20º/22º C</li>
                <li>2.    Abrigarte bien la nariz y la boca para no respirar el aire frió, también tus pies y manos para regular la tempra corporal.</li>
                <li>3.    Trata de por lo menos hacer 10 a 15 m de actividad física, para así mantener tu cuerpo a una temperatura adec claramente teniendo cuidado de tu condición y preferiblemente en el hogar.</li>
                <li>4.    Comer alimentos ricos en vitaminas A y C.</li>
                <li>5.    Hazte tus chequeo con el médico, para que observe como esta tu presión y tus pulmones.</li>
                <li>6.    Tomar agua para estar hidratado.</li>
                <li>7.    Huso de deshumificadores para la humedad y evitar así el moho, ácaros y entre otras cosas las cuales pueden causritación respiratoria.</li>
                <li>8.    Vacúnate contra la influencia ayudara a tu sistema inmune para asi evitar contagios. (2)</li>
            </ul>
        </div>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Concepción PD. Tercera edad y el deporte en invierno [Internet]. Diario Concepción. [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.diarioconcepcion.cl/deportes/2018/05/14/tercera-edad-y-el-deporte-en-invierno.html">https://www.diarioconcepcion.cl/deportes/2018/05/14/tercera-edad-y-el-deporte-en-invierno.html</a></span>
            </p>
            <br>
            <p class="italic">
            2. Vivir con Enfermedad Pulmonar Obstructiva Crónica (EPOC) [Internet]. Clínic Barcelona. [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.clinicbarcelona.org/asistencia/enfermedades/enfermedad-pulmonar-obstructiva-cronica-epoc/vivir-con-la-enfermedad">https://www.clinicbarcelona.org/asistencia/enfermedades/enfermedad-pulmonar-obstructiva-cronica-epoc/vivir-con-la-enfermedad</a></span>
            </p>
            <br>
            <p class="italic">
            3.  IMAGEN  Instituto Nacional de las Personas Adultas Mayores. Cuidemos a nuestros adultos mayores en esta época de frío [Internet]. gob.mx. [citado el 30 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.gob.mx/inapam/es/articulos/cuidemos-a-nuestros-adultos-mayores-en-esta-epoca-de-frio?idiom=es">https://www.gob.mx/inapam/es/articulos/cuidemos-a-nuestros-adultos-mayores-en-esta-epoca-de-frio?idiom=es</a></span>
            </p>
            <br>
                
            
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$7 = "D:/repos/medicine/src/pages/cuidados.astro";
const $$url$7 = "/cuidados";

const _page9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$7,
	default: $$Cuidados,
	file: $$file$7,
	url: $$url$7
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$6 = createMetadata("/D:/repos/medicine/src/pages/glosario.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$6 = createAstro("/D:/repos/medicine/src/pages/glosario.astro", "", "file:///D:/repos/medicine/");
const $$Glosario = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Glosario;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Glosario | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-start bg-white px-8 md:px-24 xl:px-48 pt-32 pb-16">
        <h2 class="font-bold text-5xl">Glosario</h2>
    </div><div class="bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="mb-4 border-b border-gray-200">
            <ul class="flex flex-wrap -mb-px text-sm font-medium text-center justify-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                <li class="mr-2" role="presentation">
                    <button class="inline-block p-4 rounded-t-lg border-b-2" id="english-tab" data-tabs-target="#english" type="button" role="tab" aria-controls="english" aria-selected="false">English</button>
                </li>
                <li class="mr-2" role="presentation">
                    <button class="inline-block p-4 rounded-t-lg border-b-2" id="spanish-tab" data-tabs-target="#spanish" type="button" role="tab" aria-controls="spanish" aria-selected="false">Español</button>
                </li>
            </ul>
        </div>
        <div id="myTabContent">
            <div class="hidden p-4" id="english" role="tabpanel" aria-labelledby="english-tab">
                <p class="font-light pb-3">Navigate from A-Z here.</p>
                <ul class="flex flex-wrap gap-6 text-2md">
                    <li>
                        <a href="#a" class="hover:text-red-700 hover:underline hover:font-bold">A</a>
                    </li>
                    <li>
                        <a href="#b" class="hover:text-red-700 hover:underline hover:font-bold">B</a>
                    </li>
                    <li>
                        <a href="#c" class="hover:text-red-700 hover:underline hover:font-bold">C</a>
                    </li>
                    <li>
                        <a href="#d" class="hover:text-red-700 hover:underline hover:font-bold">D</a>
                    </li>
                    <li>
                        <a href="#e" class="hover:text-red-700 hover:underline hover:font-bold">E</a>
                    </li>
                    <li>
                        <a href="#f" class="hover:text-red-700 hover:underline hover:font-bold">F</a>
                    </li>
                    <li>
                        <a href="#g" class="hover:text-red-700 hover:underline hover:font-bold">G</a>
                    </li>
                    <li>
                        <a href="#h" class="hover:text-red-700 hover:underline hover:font-bold">H</a>
                    </li>
                    <li>
                        <a href="#i" class="hover:text-red-700 hover:underline hover:font-bold">I</a>
                    </li>
                    <li>
                        <a href="#j" class="hover:text-red-700 hover:underline hover:font-bold">J</a>
                    </li>
                    <li>
                        <a href="#k" class="hover:text-red-700 hover:underline hover:font-bold">K</a>
                    </li>
                    <li>
                        <a href="#l" class="hover:text-red-700 hover:underline hover:font-bold">L</a>
                    </li>
                    <li>
                        <a href="#m" class="hover:text-red-700 hover:underline hover:font-bold">M</a>
                    </li>
                    <li>
                        <a href="#n" class="hover:text-red-700 hover:underline hover:font-bold">N</a>
                    </li>
                    <li>
                        <a href="#ñ" class="hover:text-red-700 hover:underline hover:font-bold">Ñ</a>
                    </li>
                    <li>
                        <a href="#o" class="hover:text-red-700 hover:underline hover:font-bold">O</a>
                    </li>
                    <li>
                        <a href="#p" class="hover:text-red-700 hover:underline hover:font-bold">P</a>
                    </li>
                    <li>
                        <a href="#q" class="hover:text-red-700 hover:underline hover:font-bold">Q</a>
                    </li>
                    <li>
                        <a href="#r" class="hover:text-red-700 hover:underline hover:font-bold">R</a>
                    </li>
                    <li>
                        <a href="#s" class="hover:text-red-700 hover:underline hover:font-bold">S</a>
                    </li>
                    <li>
                        <a href="#t" class="hover:text-red-700 hover:underline hover:font-bold">T</a>
                    </li>
                    <li>
                        <a href="#u" class="hover:text-red-700 hover:underline hover:font-bold">U</a>
                    </li>
                    <li>
                        <a href="#v" class="hover:text-red-700 hover:underline hover:font-bold">V</a>
                    </li>
                    <li>
                        <a href="#w" class="hover:text-red-700 hover:underline hover:font-bold">W</a>
                    </li>
                    <li>
                        <a href="#x" class="hover:text-red-700 hover:underline hover:font-bold">X</a>
                    </li>
                    <li>
                        <a href="#y" class="hover:text-red-700 hover:underline hover:font-bold">Y</a>
                    </li>
                    <li>
                        <a href="#z" class="hover:text-red-700 hover:underline hover:font-bold">Z</a>
                    </li>
                </ul>
                <div class="mt-24">
                    <ul id="a">
                        <li class="pb-6"><h1 class="text-5xl font-extrabold">A</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Afferent pathways</h2>
                            <p class="font-light">Pathway by which sensitive information is sent to the control center</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Acid</h2>
                            <p class="font-light">Substance that emits hydrogen ions and that in the  union with the bases form salts</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Acid-base balance</h2>
                            <p class="font-light">Acid and base balance maintained by the body to maintain a constant pH</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Asthma</h2>
                            <p class="font-light">Condition in which the airways narrow and swell which can produce more mucus</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">ATP/adenosine triphosphate</h2>
                            <p class="font-light">Is a nucleotide that is responsible for obtaining cellular energy</p>
                        </li>
                    </ul>
                    <ul id="b">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">B</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Bacteria/s</h2>
                            <p class="font-light">Single-celled microorganism without a defined nucleus </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Base</h2>
                            <p class="font-light">Substance that has the ability to adopt hydrogen ions</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Blood pressure</h2>
                            <p class="font-light">Is the pressure that blood  exerts against the walls of the arteries</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Body temperature</h2>
                            <p class="font-light">Level of body temperature that in normal state should be 37°C (98.6°)</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Bronchitis</h2>
                            <p class="font-light">Inflammation of the lining of the bronchi through which air circulates in and out of the lungs</p>
                        </li>
                    </ul>
                    <ul id="c">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">C</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Cardiovascular</h2>
                            <p class="font-light">System composed of the heart and blood vessels.</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Catabolism</h2>
                            <p class="font-light">Set of metabolic processes of degradation of substances to obtain simpler ones</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Catalyze</h2>
                            <p class="font-light">Produce a catalysis in a chemical reaction </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Chronic noncommunicable diseases</h2>
                            <p class="font-light">A group of diseases that are not caused by infections result in long-term health consequences. Diabetes, hypertension, cancer…</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">CNS (central nervous system)</h2>
                            <p class="font-light">Part of the nervous system made up of the brain and spinal cord </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">CO2 (carbon dioxide)</h2>
                            <p class="font-light">Gas heavier than air, formed by the combination of carbon atom and two oxygen atoms</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Communicable diseases</h2>
                            <p class="font-light">Are diseases that are transmitted from person to person or from animals to people. Whooping cough, measles, sexually transmitted diseases</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Comorbidity/s</h2>
                            <p class="font-light">Coexistence of two or more diseases in the same individual, usually related  </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Contraction</h2>
                            <p class="font-light">In physiology it is the action of   either a muscle or an organ either a muscle or an organ</p>
                        </li>
                    </ul>
                    <ul id="d">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">D</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="e">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">E</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Efferent pathways</h2>
                            <p class="font-light">They are signals of information </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Electrons</h2>
                            <p class="font-light">Elementary particle with negative electric charge </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Emphysema</h2>
                            <p class="font-light">Lung disease that causes shortness of breath due to destruction and dilation of the alveoli </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Enzymes</h2>
                            <p class="font-light">Protein that catalyzes a specific biochemical reaction of metabolism</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Extracellular</h2>
                            <p class="font-light">Which is located or occurs outside the cell </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Extracorporeal</h2>
                            <p class="font-light">Medical procedure that is performed outside the body </p>
                        </li>
                    </ul>
                    <ul id="f">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">F</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Fatty acids</h2>
                            <p class="font-light">Biomolecules of lipid nature</p>
                        </li>
                    </ul>
                    <ul id="g">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">G</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="h">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">H</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Heart disease</h2>
                            <p class="font-light">Progressive disease of the myocardium or heart muscle, due to narrowing of the small blood vessels that supply blood and oxygen to the heart </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Heart rate</h2>
                            <p class="font-light">It is in number of contractions of the heart or pulsations per minute, in an adult in normal condition and at rest it ranges between 60 to 100 beats per minute</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Homeostasis</h2>
                            <p class="font-light">Set of self-regulating phenomena, which lead to the maintenance of constancy in the composition and properties of the internal environment of an organism </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Hypothalamus</h2>
                            <p class="font-light">Region of the brain located at the base of the brain, attached to the pituitary gland by a nerve stalk and in which important centers of vegetative life reside </p>
                        </li>
                    </ul>
                    <ul id="i">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">I</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Infection</h2>
                            <p class="font-light">Invasion and multiplication of germs in the body</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Intracellular</h2>
                            <p class="font-light">Which is located or occurs within the cell </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ion/s</h2>
                            <p class="font-light">Atom or grouping of atoms that by loss or gain of one more electrons acquiring electric charge</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Hypothalamus</h2>
                            <p class="font-light">Region of the brain located at the base of the brain, attached to the pituitary gland by a nerve stalk and in which important centers of vegetative life reside </p>
                        </li>
                    </ul>
                    <ul id="j">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">J</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="k">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">K</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Krebs cycle</h2>
                            <p class="font-light">Is a metabolic pathway that is part of the cellular respiration of aerobic cells </p>
                        </li>
                    </ul>
                    <ul id="l">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">L</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Leukocytes/white blood cells</h2>
                            <p class="font-light">These are the only blood cells found throughout the body</p>
                        </li>
                    </ul>
                    <ul id="m">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">M</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Metabolic reactions</h2>
                            <p class="font-light">Chemical reaction that converts food into energy </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Molecule</h2>
                            <p class="font-light">A minimum unit of a substance that retains its chemical properties and may consist of the same or different atoms </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Myocardium</h2>
                            <p class="font-light">Muscle tissue of the heart responsible for pumping blood through the circulatory system through its contraction </p>
                        </li>
                    </ul>
                    <ul id="n">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">N</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="ñ">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Ñ</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="o">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">O</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="p">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">P</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Plasma membrane</h2>
                            <p class="font-light">Lipid bilayer that covers the cell and delimits it by separating the intracellular material from the extracellular </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Product</h2>
                            <p class="font-light">Result of the binding of the substrate with an enzyme </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Protein/s</h2>
                            <p class="font-light">Constituent substance of living matter, formed by one or more chains of amino acids </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Protons</h2>
                            <p class="font-light">Particle with positive electric charge, which is part of the nucleus of the atom </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ph</h2>
                            <p class="font-light">Index expressing the degree of acidity or alkalinity of a solution</p>
                        </li>
                    </ul>
                    <ul id="q">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Q</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="r">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">R</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Respiratory acidosis</h2>
                            <p class="font-light">Condition that happens when the  lungs are unable to remove CO2 from the body</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Respiratory rate</h2>
                            <p class="font-light">Is the number of breaths per minute in adults  their normal standards range between 15-20 breaths per minute</p>
                        </li>
                    </ul>
                    <ul id="s">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">S</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">SNP (peripheral nervous system)</h2>
                            <p class="font-light">Part of the nervous system that communicates the central system with peripheral structures </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Stroke</h2>
                            <p class="font-light">Occurs by interrupting blood circulation anywhere in the brain and with it the supply of oxygen </p>
                        </li>
                    </ul>
                    <ul id="t">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">T</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Thermoreceptors</h2>
                            <p class="font-light">Group of nerve endings located in the skin with the aim of capturing  and responding to cold and/or heat stimuli</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Thermoregulation</h2>
                            <p class="font-light">Regulation of body temperature </p>
                        </li>
                    </ul>
                    <ul id="u">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">U</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="v">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">V</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vasoconstriction</h2>
                            <p class="font-light">Is the narrowing of blood vessels</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ventricular fibrillation</h2>
                            <p class="font-light">Increased heart rate that begins in the lower chambers of the heart</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vessel dilation</h2>
                            <p class="font-light">Increased internal diameter of blood vessels</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Viruses</h2>
                            <p class="font-light">Organisms of very simple structure, composed of proteins and nucleic acids and can reproduce itself</p>
                        </li>
                    </ul>
                    <ul id="w">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">W</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="x">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">X</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="y">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Y</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="z">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Z</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="hidden p-4 rounded-lg" id="spanish" role="tabpanel" aria-labelledby="spanish-tab">
                <p class="font-light pb-3">Navega desde la A a la Z aqui.</p>
                <ul class="flex flex-wrap gap-6 text-2md">
                    <li>
                        <a href="#a-es" class="hover:text-red-700 hover:underline hover:font-bold">A</a>
                    </li>
                    <li>
                        <a href="#b-es" class="hover:text-red-700 hover:underline hover:font-bold">B</a>
                    </li>
                    <li>
                        <a href="#c-es" class="hover:text-red-700 hover:underline hover:font-bold">C</a>
                    </li>
                    <li>
                        <a href="#d-es" class="hover:text-red-700 hover:underline hover:font-bold">D</a>
                    </li>
                    <li>
                        <a href="#e-es" class="hover:text-red-700 hover:underline hover:font-bold">E</a>
                    </li>
                    <li>
                        <a href="#f-es" class="hover:text-red-700 hover:underline hover:font-bold">F</a>
                    </li>
                    <li>
                        <a href="#g-es" class="hover:text-red-700 hover:underline hover:font-bold">G</a>
                    </li>
                    <li>
                        <a href="#h-es" class="hover:text-red-700 hover:underline hover:font-bold">H</a>
                    </li>
                    <li>
                        <a href="#i-es" class="hover:text-red-700 hover:underline hover:font-bold">I</a>
                    </li>
                    <li>
                        <a href="#j-es" class="hover:text-red-700 hover:underline hover:font-bold">J</a>
                    </li>
                    <li>
                        <a href="#k-es" class="hover:text-red-700 hover:underline hover:font-bold">K</a>
                    </li>
                    <li>
                        <a href="#l-es" class="hover:text-red-700 hover:underline hover:font-bold">L</a>
                    </li>
                    <li>
                        <a href="#m-es" class="hover:text-red-700 hover:underline hover:font-bold">M</a>
                    </li>
                    <li>
                        <a href="#n-es" class="hover:text-red-700 hover:underline hover:font-bold">N</a>
                    </li>
                    <li>
                        <a href="#ñ-es" class="hover:text-red-700 hover:underline hover:font-bold">Ñ</a>
                    </li>
                    <li>
                        <a href="#o-es" class="hover:text-red-700 hover:underline hover:font-bold">O</a>
                    </li>
                    <li>
                        <a href="#p-es" class="hover:text-red-700 hover:underline hover:font-bold">P</a>
                    </li>
                    <li>
                        <a href="#q-es" class="hover:text-red-700 hover:underline hover:font-bold">Q</a>
                    </li>
                    <li>
                        <a href="#r-es" class="hover:text-red-700 hover:underline hover:font-bold">R</a>
                    </li>
                    <li>
                        <a href="#s-es" class="hover:text-red-700 hover:underline hover:font-bold">S</a>
                    </li>
                    <li>
                        <a href="#t-es" class="hover:text-red-700 hover:underline hover:font-bold">T</a>
                    </li>
                    <li>
                        <a href="#u-es" class="hover:text-red-700 hover:underline hover:font-bold">U</a>
                    </li>
                    <li>
                        <a href="#v-es" class="hover:text-red-700 hover:underline hover:font-bold">V</a>
                    </li>
                    <li>
                        <a href="#w-es" class="hover:text-red-700 hover:underline hover:font-bold">W</a>
                    </li>
                    <li>
                        <a href="#x-es" class="hover:text-red-700 hover:underline hover:font-bold">X</a>
                    </li>
                    <li>
                        <a href="#y-es" class="hover:text-red-700 hover:underline hover:font-bold">Y</a>
                    </li>
                    <li>
                        <a href="#z-es" class="hover:text-red-700 hover:underline hover:font-bold">Z</a>
                    </li>
                </ul>
                <div class="mt-24">
                    <ul id="a-es">
                        <li class="pb-6"><h1 class="text-5xl font-extrabold">A</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Accidentes cerebrovasculares ACV</h2>
                            <p class="font-light">Se produce por la interrupción de la circulación de la sangre en cualquier parte del cerebro y con ello el suministro de oxigeno </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Acido</h2>
                            <p class="font-light">Sustancia que sede iones de hidrogeno y que en la unión con las bases forman sales </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ácidos grasos</h2>
                            <p class="font-light">Biomoléculas de naturaleza lipídica </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Acidosis respiratoria</h2>
                            <p class="font-light">Afección que sucede cuando los pulmones no pueden eliminar el CO2 del cuerpo</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Asma</h2>
                            <p class="font-light">Afección en la cual las vías respiratorias se estrechan e hinchan lo que puede producir mayor mucosidad </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">ATP/adenosín trifosfato</h2>
                            <p class="font-light">Es un nucleótido que se encarga de la obtención de energía celular </p>
                        </li>
                    </ul>
                    <ul id="b-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">B</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Bacteria/s</h2>
                            <p class="font-light">Microorganismo unicelular sin núcleo definido </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Base</h2>
                            <p class="font-light">Sustancia que tiene la capacidad de adoptar iones de hidrogeno</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Bronquitis</h2>
                            <p class="font-light">Inflamación del revestimiento de los bronquios por los cuales circula el aire adentro y fuera de los pulmones </p>
                        </li>
                    </ul>
                    <ul id="c-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">C</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Cardiopatía</h2>
                            <p class="font-light">Enfermedad progresiva del miocardio o musculo cardiaco, se debe al estrechamiento de los pequeños vasos sanguíneos que suministran sangre y oxígeno al corazón </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Cardiovascular</h2>
                            <p class="font-light">Sistema compuesto por el corazón y los vasos sanguíneos.</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Catabolismo</h2>
                            <p class="font-light">Conjunto de procesos metabólicos de degradación de sustancias para obtener otras mas simples </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Catalizan</h2>
                            <p class="font-light">Producir una catálisis en una reacción química </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Células eucariotas</h2>
                            <p class="font-light">Son la unidad básica de los organismos animales, se diferencia por tener un núcleo definido.</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ciclo de Krebs</h2>
                            <p class="font-light">Es una ruta metabólica que forma parte de la respiración celular de las células aerobias </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">CO2 (dióxido de carbono)</h2>
                            <p class="font-light">Gas ms pesado que el aire, formado por la combinación de átomo de carbono y dos de oxígenos </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Comorbilidad/es</h2>
                            <p class="font-light">Coexistencia de dos o mas enfermedades en un mismo individuo, generalmente relacionadas  </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Contracción</h2>
                            <p class="font-light">En la fisiología es la acción de contraer o contraerse ya sea un musculo o un órgano </p>
                        </li>
                    </ul>
                    <ul id="d-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">D</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="e-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">E</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Electrones</h2>
                            <p class="font-light">Partícula elemental con carga eléctrica negativa </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Enfermedades crónicas no transmisibles</h2>
                            <p class="font-light">Grupo de enfermedades que no son causadas por infecciones dan como resultado consecuencias de salud a largo plazo. Diabetes, hipertensión, cáncer…</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Enfermedades transmisibles</h2>
                            <p class="font-light">Son enfermedades que son transmitidas de persona a persona o de animales a personas. Tos ferina, sarampión, enfermedades de transmisión sexual </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Enfisema</h2>
                            <p class="font-light">Enfermedad pulmonar que provoca dificultad para respirar debido a la destrucción y la dilatación de los alveolos </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Enzimas</h2>
                            <p class="font-light">Proteína que cataliza una reacción bioquímica especifica del metabolismo </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Equilibrio acido-base</h2>
                            <p class="font-light">Balance de ácido y base que mantiene el organismo para mantener un pH constante </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Extracelular</h2>
                            <p class="font-light">Que esta situado u ocurre fuera de la célula </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Extracorpóreo</h2>
                            <p class="font-light">Procedimiento medico que se realiza fuera del cuerpo </p>
                        </li>
                    </ul>
                    <ul id="f-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">F</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Fibrilación ventricular</h2>
                            <p class="font-light">Aumento del ritmo cardiaco que comienza en las cavidades inferiores del corazón </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Frecuencia cardiaca</h2>
                            <p class="font-light">Es en numero de contracciones del corazón o pulsaciones por minuto, en un adulto en condición normal y en reposo oscila entre 60 a 100 latidos por minuto </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Frecuencia respiratoria</h2>
                            <p class="font-light">Es la cantidad de respiraciones por minuto en los adultos sus estándares normales oscilan entre 15-20 respiraciones por minuto </p>
                        </li>
                    </ul>
                    <ul id="g-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">G</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="h-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">H</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Hipotálamo</h2>
                            <p class="font-light">Región del encéfalo situada en la base cerebral, unida a la hipófisis por un tallo nervioso y en las que residen centros importantes de la vida vegetativa </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Hipotermia</h2>
                            <p class="font-light">Descenso de la temperatura del cuerpo por debajo de lo normal </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Homeostasis</h2>
                            <p class="font-light">Conjunto de fenómenos de autorregulación, que conducen al mantenimiento de la constancia en la composición y propiedades del medio interno de un organismo </p>
                        </li>
                    </ul>
                    <ul id="i-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">I</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Infección</h2>
                            <p class="font-light">Invasión y multiplicación de gérmenes en el cuerpo</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Intracelular</h2>
                            <p class="font-light">Que esta situado u ocurre dentro de la célula </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ion/es</h2>
                            <p class="font-light">Átomo o agrupación de átomos que por perdida o ganancia de uno mas electrones adquiriendo carga eléctrica </p>
                        </li>
                    </ul>
                    <ul id="j-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">J</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="k-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">K</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="l-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">L</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Leucocitos/glóbulos blancos</h2>
                            <p class="font-light">Son las únicas células sanguíneas que se encuentran en todo el organismo </p>
                        </li>
                    </ul>
                    <ul id="m-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">M</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Membrana plasmática</h2>
                            <p class="font-light">Bicapa lipídica que recubre la célula y la delimita separando el material intracelular del extracelular </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Miocardio</h2>
                            <p class="font-light">Tejido muscular del corazón encargado de bombear la sangre por el sistema circulatorio mediante su contracción </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Molécula</h2>
                            <p class="font-light">Unidad mínima de una sustancia que conserva sus propiedades químicas y puede estar formada por átomos iguales o diferentes </p>
                        </li>
                    </ul>
                    <ul id="n-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">N</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="ñ-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Ñ</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="o-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">O</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="p-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">P</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Presión arterial</h2>
                            <p class="font-light">Es la presión que ejerce la sangre contra las paredes de las arterias </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Producto</h2>
                            <p class="font-light">Resultado de la unión del sustrato con una enzima </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Proteína/s</h2>
                            <p class="font-light">Sustancia constitutiva de la materia viva, formada por una o varias cadenas de aminoácidos </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Protones</h2>
                            <p class="font-light">Partícula con carga eléctrica positiva, que forma parte del núcleo del átomo </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Ph</h2>
                            <p class="font-light">Índice que expresa el grado de acidez o alcalinidad de una disolución </p>
                        </li>
                    </ul>
                    <ul id="q-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Q</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="r-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">R</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Reacciones metabólicas</h2>
                            <p class="font-light">Reacción química que convierte los alimentos en energía x</p>
                        </li>
                    </ul>
                    <ul id="s-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">S</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">SNC (sistema nervioso central)</h2>
                            <p class="font-light">Parte del sistema nerviosos constituido por el encéfalo y la medula espinal </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">SNP (sistema nervioso periférico)</h2>
                            <p class="font-light">Parte del sistema nerviosos que comunica al sistema central con las estructuras periféricas </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Sustrato</h2>
                            <p class="font-light">Sustancia sobre la cual actúa una enzima </p>
                        </li>
                    </ul>
                    <ul id="t-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">T</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Temperatura corporal</h2>
                            <p class="font-light">Nivel de temperatura del cuerpo que en estado normal debe de ser de 37°C (98.6°)</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Termorreceptores</h2>
                            <p class="font-light">Grupo de terminaciones nerviosas ubicas en la piel con el objetivo de captar y responder a estímulos de frio y/o calor </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Termorregulación</h2>
                            <p class="font-light">Regulación de la temperatura corporal </p>
                        </li>
                    </ul>
                    <ul id="u-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">U</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="v-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">V</h1></li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vasoconstricción</h2>
                            <p class="font-light">Es el estrechamiento de los vasos sanguíneos </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vaso dilatación</h2>
                            <p class="font-light">Incremento del diámetro interno de los vasos sanguíneos </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vías aferentes</h2>
                            <p class="font-light">Vía por la cual se envía información sensitiva hacia el centro de control</p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Vías eferentes</h2>
                            <p class="font-light">Son señales de información </p>
                        </li>
                        <li class="py-6">
                            <h2 class="font-bold text-2xl">Virus</h2>
                            <p class="font-light">Organismos de estructura muy sencilla, compuesto de proteínas y ácidos nucleicos y es capaz de reproducirse solo</p>
                        </li>
                    </ul>
                    <ul id="w-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">W</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="x-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">X</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="y-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Y</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                    <ul id="z-es">
                        <li class="pt-12 pb-6"><h1 class="text-5xl font-extrabold">Z</h1></li>
                        <li class="py-6">
                            <p class="font-light text-3xl">...</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$6 = "D:/repos/medicine/src/pages/glosario.astro";
const $$url$6 = "/glosario";

const _page10 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$6,
	default: $$Glosario,
	file: $$file$6,
	url: $$url$6
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$5 = createMetadata("/D:/repos/medicine/src/pages/nosotras.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$5 = createAstro("/D:/repos/medicine/src/pages/nosotras.astro", "", "file:///D:/repos/medicine/");
const $$Nosotras = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Nosotras;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Glosario | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-start bg-white px-8 md:px-24 xl:px-48 pt-32 pb-16">
        <h2 class="font-bold text-5xl">Sobre nosotras</h2>
        <p class="pt-6">Conoce mas sobre el equipo AVA.</p>
    </div><div class="flex flex-wrap md:flex-nowrap gap-16 bg-white px-8 md:px-24 xl:px-64 pt-32 pb-16">
        <div class="rounded-full" style="max-width: 300px; width:500px; height:500px; max-height: 300px; background-image: url('../../public/alexandra.png'); background-position: center; background-size: cover; background-repeat: no-repeat;"></div>
        <div class="my-auto">
            <h1 class="font-bold text-2xl pb-3">Alexandra Gonzalez Escobar</h1>
            <p>Soy estudiante de primer semestre de enfermería en la universidad de la Sabana, tengo 22 años y quiero llegar a hacer alguien que pueda ayudar a la gente por medio del conocimiento, dar un servicio inigualable y dar muchas sonrisas.</p>
        </div>
    </div><div class="flex flex-wrap md:flex-nowrap gap-16 bg-white px-8 md:px-24 xl:px-64 pt-32 pb-16">
        <div class="rounded-full" style="max-width: 300px; width:500px; height:500px; max-height: 300px; background-image: url('../../public/yuli.png'); background-position: center; background-size: cover; background-repeat: no-repeat;"></div>
        <div class="my-auto">
            <h1 class="font-bold text-2xl pb-3">Yulieth Vanessa López Gutiérrez </h1>
            <p>Fisioterapia primer semestre y su objetivo a futuro es especializarse en rehabilitación pediátrica.</p>
        </div>
    </div><div class="flex flex-wrap md:flex-nowrap gap-16 bg-white px-8 md:px-24 xl:px-64 pt-32 pb-48">
        <div class="rounded-full" style="max-width: 300px; width:500px; height:500px; max-height: 300px; background-image: url('../../public/a.png'); background-position: center; background-size: cover; background-repeat: no-repeat;"></div>
        <div class="my-auto">
            <h1 class="font-bold text-2xl pb-3">Ana María Toloza Camacho</h1>
            <p>Soy estudiante de fisioterapia de primer semestre con el objetivo a futuro de convertirme en especialista en terapia manual ortopédica.</p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$5 = "D:/repos/medicine/src/pages/nosotras.astro";
const $$url$5 = "/nosotras";

const _page11 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$5,
	default: $$Nosotras,
	file: $$file$5,
	url: $$url$5
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$4 = createMetadata("/D:/repos/medicine/src/pages/corazon.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$4 = createAstro("/D:/repos/medicine/src/pages/corazon.astro", "", "file:///D:/repos/medicine/");
const $$Corazon = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Corazon;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Estructura y Funci\xF3n del coraz\xF3n | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Estructura y Función del corazón</h1>
        <p>Formado, células denominadas cardiomiocitos o también conocidas como célula muscular cardiaca, esto más internamente. Por otro lado, está formado por dos bombas separadas:  corazón derecho que bombea sangre hacia los pulmones y un corazón izquierdo que bombea sangre a través de la circulación sistémica que aporta flujo sanguíneo a los demás órganos y tejidos del cuerpo.</p>
        <br>
        <p>Además, estos corazones es una bomba bicameral pulsátil, esto quiere decir que están formados por una aurícula en la parte superior y un ventrículo en la inferior; las aurículas es una bomba débil de cebado del ventrículo, las cuales colaboran trasportando sangre hacia el ventrículo correspondiente. Los ventrículos aportarán la principal fuerza de bombeo para impulsar la sangre, sea hacia pulmones por el ventrículo derecho o hacia la circulación sistemática por el ventrículo izquierdo (1).</p>
        <img src="../../public/heart2.png" alt="" class="w-full md:w-[30%] my-8 mx-auto">

        <h1 class="text-md md:text-2xl font-extrabold my-auto pt-12 uppercase text-left">Enfermedades cardiovasculares</h1>
        <br>
        <p class="leading-loose">
            La cardiopatía coronaria: enfermedad de los vasos sanguíneos que irrigan el músculo cardiaco;
            <br>
            Las enfermedades cerebrovasculares: enfermedades de los vasos sanguíneos que irrigan el cerebro;
            <br>
            Las arteriopatías periféricas: enfermedades de los vasos sanguíneos que irrigan los miembros superiores e inferiores;
            <br>
            La cardiopatía reumática: lesiones del músculo cardiaco y de las válvulas cardíacas debidas a la fiebre reumática, una enfermedad causada por bacterias denominadas estreptococos;
            <br>
            Las cardiopatías congénitas: malformaciones del corazón presentes desde el nacimiento; y las trombosis venosas profundas y embolias pulmonares: coágulos de sangre (trombos) en las venas de las piernas, que pueden desprenderse (émbolos) y alojarse en los vasos del corazón y los pulmones.</p>
        <br>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Hall JE. Guyton y Hall. Tratado de Fisiologia Medica + Studentconsult. 12a ed. Elsevier; 2016.</p>
            <br>
            <p class="italic">
            2. Imagen 1 Estrutura del corazón Hall JE. Guyton y Hall. Tratado de Fisiologia Medica + Studentconsult. 12a ed. Elsevier; 2016.
            </p>
            <br>
            <p class="italic">
                3. Enfermedades cardiovasculares [Internet]. www.who.int. Available from: <span><a class="text-red-900 font-bold" href="https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)">https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$4 = "D:/repos/medicine/src/pages/corazon.astro";
const $$url$4 = "/corazon";

const _page12 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$4,
	default: $$Corazon,
	file: $$file$4,
	url: $$url$4
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$3 = createMetadata("/D:/repos/medicine/src/pages/podcast.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$3 = createAstro("/D:/repos/medicine/src/pages/podcast.astro", "", "file:///D:/repos/medicine/");
const $$Podcast = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Podcast;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Podcast | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="w-screen h-72" style="background-image: url('../../public/photo-2.jpg'); background-repeat: no-repeat; background-size: cover; background-position:center;">
  </div><div class="px-0 md:px-56">
    <div class="h-[120vh]">
      <div class="grid-rows-1 absolute mx-auto h-[60rem] md:inset-5 md:top-[40%] w-screen xl:w-[80%] 2xl:w-[70%] px-0 lg:px-16">
        <div class="relative">
          <!-- Slide 1 -->
          <div class="text-justify bg-white px-8 md:px-24 xl:px-40 pb-32" id="page1">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">La voz de la experiencia</p>
            </div>
            <!-- <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">EL CAMBIO CLIMÁTICO Y LAS BAJAS TEMPERATURAS EN COLOMBIA</h1> -->
            <div class="grid grid-rows-1 grid-cols-1 md:grid-cols-2 gap-16">
                <div class="h-[300px] w-full mx-auto" style="background-image: url('../../public/lucey.png'); background-repeat: no-repeat; background-size: cover; background-position:center;">
                </div>
                <div>
                    <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold pb-6 capitalize"><span class="text-red-700">LUCEY</span> TABARES SEGURA</h3>
                    <p class="pb-6 opacity-50">Paciente de 73 años de edad, que recodé en Cartagena bolívar, por tener un EPOC, nos cuenta un poco de su historia, de como al llegar esta enfermedad crónico obstructiva, tuvo que dejar Bogotá para el mejoramiento de su salud.</p>
                    <audio controls class="w-full">
                        <source src="../../public/entrevistaLucey.aac" type="audio/aac">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>


            <div class="grid grid-rows-1 grid-cols-1 md:grid-cols-2 gap-16 my-40">
                <div>
                    <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold pb-6 uppercase"><span class="text-red-700">Samuel</span> X. Pimienta</h3>
                    <p class="pb-6 opacity-50">Médico MSc en Informática Educativa por la Universidad de La Sabana. Me dedico a la educación médica y a la inteligencia artificial en salud.</p>
                    <audio controls class="w-full">
                        <source src="../../public/entrevistaSamuel.aac" type="audio/aac">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                <div class="h-[300px] w-full mx-auto" style="background-image: url('../../public/samuel.png'); background-repeat: no-repeat; background-size: cover; background-position:top;">
                </div>
            </div>


            <div class="grid grid-rows-1 grid-cols-1 md:grid-cols-2 gap-16 my-40">
                <div class="h-[300px] w-full mx-auto" style="background-image: url('../../public/margarita.png'); background-repeat: no-repeat; background-size: cover; background-position:top;">
                </div>
                <div>
                    <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold pb-6 capitalize"><span class="text-red-700">MARGARITA</span> RAMÍREZ CARDOZO</h3>
                    <p class="pb-6 opacity-50">Enfermera, especialista en Docencia Universitaria y magister en Cuidado Crítico.</p>
                    <audio controls class="w-full">
                        <source src="../../public/entrevistaMargarita.aac" type="audio/aac">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>


            <div class="grid grid-rows-1 grid-cols-1 md:grid-cols-2 gap-16 my-40">
              <div>
                  <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold pb-6 uppercase"><span class="text-red-700">IVÁN</span> RAMÍREZ CARDOZO</h3>
                  <p class="pb-6 opacity-50">Fisioterapeuta, magister en administración en salud, especialista en fisioterapia en adulto crítico.</p>
                  <audio controls class="w-full">
                      <source src="../../public/entrevistaIvan.aac" type="audio/aac">
                      Your browser does not support the audio element.
                  </audio>
              </div>
              <div class="h-[300px] w-full mx-auto" style="background-image: url('../../public/ivan.jpg'); background-repeat: no-repeat; background-size: cover; background-position:top;">
              </div>
          </div>
            

            <!-- <div class="mt-24 opacity-60 w-full">
              <p class="italic">
                1. Dic 9. La OMS revela las principales causas de muerte y discapacidad en el mundo: 2000-2019 [Internet]. Paho.org. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019">https://www.paho.org/es/noticias/9-12-2020-oms-revela-principales-causas-muerte-discapacidad-mundo-2000-2019</a></span>
              </p>
              <br>
              <p class="italic">
                2. Semana. ¿Cómo está el corazón de los colombianos? [Internet]. Semana.com Últimas Noticias de Colombia y el Mundo. 2020 [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/">https://www.semana.com/nacion/articulo/como-esta-el-corazon-de-los-colombianos/202037/</a></span>
              </p>
              <br>
              <p class="italic">
                3. Diciembre BDC. Boletines Poblacionales 1 : Personas Adultas Mayores de 60 años Oficina de Promoción Social Ministerio de Salud y Protección Social I-2020 [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf">https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/PS/280920-boletines-poblacionales-adulto-mayorI-2020.pdf</a></span>
              </p>
              <br>
              <p class="italic">
                4. Colombia frente al calentamiento global - Universidad del Rosario [Internet]. Edu.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/">https://www.urosario.edu.co/Investigacion/UCD/Articulos/Colombia-frente-al-calentamiento-global/</a></span>
              </p>
              <br>
              <p class="italic">
                5. Cambio Climático - IDIGER [Internet]. Gov.co. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.idiger.gov.co/rcc">https://www.idiger.gov.co/rcc</a></span>
              </p>
              <br>
              <p class="italic">
                6. ¿Qué efectos tiene el frío sobre nuestra salud? - Blog [Internet]. ISGlobal. [citado el 23 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0">https://www.isglobal.org/healthisglobal/-/custom-blog-portlet/-que-efectos-tiene-el-frio-sobre-nuestra-salud-/5734329/0</a></span>
              </p>
              <br>
              <p class="italic">
                7.  Ministerio de Ambiente Y Desarrollo Sostenible. Colombia CSHAPCM. ¿QUÉ ES EL CAMBIO CLIMÁTICO Y CÓMO AFECTA A COLOMBIA? [Internet]. Colombia: Fundacion accion solidaria; 13/oct/2016. Disponible en: <span><a class="text-red-900 font-bold"  href="https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria">https://www.youtube.com/watch?v=d-b03pFg7UA&ab_channel=Fundaci%C3%B3nAcci%C3%B3nSocialSolidaria</a></span>
              </p>
              <br>
              <p class="italic">
                8. IDEAM. TEMPERATURA MEDIA (°C) PARA EL PERIODO 1976-2005 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold"  href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900954">See details</a></span>
              </p>
              <br>
              <p class="italic">
                9. IDEAM. Índice de Confort Térmico   Período 2011-2040 [Internet]. IDEAM. 24AD [cited 20AD Oct]. Disponible en: <span><a class="text-red-900 font-bold"  href="http://www.ideam.gov.co/galeria-de-mapas?p_p_id=110_INSTANCE_4VnjNLZDi78B&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_110_INSTANCE_4VnjNLZDi78B_struts_action=%2Fdocument_library_display%2Fview_file_entry&_110_INSTANCE_4VnjNLZDi78B_redirect=http%3A%2F%2Fwww.ideam.gov.co%2Fgaleria-de-mapas%2F-%2Fdocument_library_display%2F4VnjNLZDi78B%2Fview%2F511760%3F_110_INSTANCE_4VnjNLZDi78B_advancedSearch%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_keywords%3D%26_110_INSTANCE_4VnjNLZDi78B_cur2%3D2%26_110_INSTANCE_4VnjNLZDi78B_topLink%3Dhome%26p_r_p_564233524_resetCur%3Dfalse%26_110_INSTANCE_4VnjNLZDi78B_delta2%3D20%26_110_INSTANCE_4VnjNLZDi78B_andOperator%3Dtrue&_110_INSTANCE_4VnjNLZDi78B_fileEntryId=98900863">See details</a></span>
              </p>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>` })}`;
});

const $$file$3 = "D:/repos/medicine/src/pages/podcast.astro";
const $$url$3 = "/podcast";

const _page13 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$3,
	default: $$Podcast,
	file: $$file$3,
	url: $$url$3
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$2 = createMetadata("/D:/repos/medicine/src/pages/celula.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$2 = createAstro("/D:/repos/medicine/src/pages/celula.astro", "", "file:///D:/repos/medicine/");
const $$Celula = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Celula;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\xBFQu\xE9 es la c\xE9lula? | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Qué es la célula?</h1>
        <p>Las células son unidades estructurales y funcionales vivientes rodeadas por una membrana. Todas se forman a partir de células preexistentes por un proceso conocido como división celular, a través del cual una célula se divide en dos células idénticas. Cada tipo de célula cumple un papel específico para mantener la homeostasis y contribuye a las diversas funciones del organismo humano. [1].</p>
        <br>
        <p class="text-xl font-bold">Componentes:</p>
        <br>
        <ul>
            <li>•  MEMBRANA PLASMÁTICA: Bicapa lipídica semipermeable formada por fosfolípidos, proteínas y carbohidratos, esta representa el limite entre el medio extracelular e intracelular.</li>
            <li>•  Citosol: Es la porción liquida que rodea a los orgánulos.</li>
            <li>•  Citoplasma: Abarca todos los componentes que se encuentran entre la, membrana plasmática.</li>
            <li>•  Cilios y flagelos: Estos son proyecciones móviles de la superficie celular, los flagelos los podemos encontrar en los espermatozoides y cilios en las trompas de Falopio.</li>
            <li>•  Ribosoma: Sitio donde se sintetizan las proteínas.</li>
            <li>•  Retículo endoplásmico (RE): Red de membranas en forma de sacos aplanados hay 2 el retículo endoplasmático rugoso y el liso, la fusión del liso es síntesis de ácidos grasos y el rugoso sintetiza glucoproteínas y fosfolípidos.</li>
            <li>•  Aparato de Golgi: Este modifica, clasifica, envuelve y trasporta proteínas que recibe del retículo rugoso.</li>
            <li>•  Lisosoma: Digiere sustancias que entran en la célula y trasporta su producto hasta el citosol, función de autofagia, y responsable de la digestión celular.</li>
            <li>•  Peroxisoma: Oxida ácidos grasos, detoxifica sustancias nocivas como el peróxido de hidrogeno y radicales libre asociados a él.</li>
            <li>•  Mitocondria: Fosforilación oxidativa, genera la mayor parte del ATP a través de la respiración aeróbica [ 1].</li>
        </ul>
        <div class="mt-12">
            <embed type="text/html" src="http://www.objetos.unam.mx/biologia/celulaEucariota/index.html" width="100%" height="800px">
            <a class="font-bold text-red-800" href="http://www.objetos.unam.mx/biologia/celulaEucariota/index.html">Observa  la célula desde una vista 3D</a>
        </div>

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. Derrickson B, Tortora GJ, A02. Prometheus. Atlas de anatomia. Ed. Medica Panamericana; 2013.
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file$2 = "D:/repos/medicine/src/pages/celula.astro";
const $$url$2 = "/celula";

const _page14 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$2,
	default: $$Celula,
	file: $$file$2,
	url: $$url$2
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$1 = createMetadata("/D:/repos/medicine/src/pages/sabias.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
    let currentpage = 1;

    var page_1 = document.getElementById("page1");
    var page_2 = document.getElementById("page2");
    var page_3 = document.getElementById("page3");
    var page_4 = document.getElementById("page4");
    var page_5 = document.getElementById("page5");
    var page_6 = document.getElementById("page6");
    var page_7 = document.getElementById("page7");
    var page_8 = document.getElementById("page8");
    var page_9 = document.getElementById("page9");

    window.onload = function load() {
      page_1.style.visibility = "visible";
      page_2.style.visibility = "hidden";
      page_3.style.visibility = "hidden";
      page_4.style.visibility = "hidden";
      page_5.style.visibility = "hidden";
      page_6.style.visibility = "hidden";
      page_7.style.visibility = "hidden";
      page_8.style.visibility = "hidden";
      page_9.style.visibility = "hidden";
    }

    function changePagePrev() {
      if (currentpage !== 1) {
        currentpage--;
        if (currentpage == 1) {
          page_1.style.visibility = "visible";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 2) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "visible";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 3) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "visible";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 4) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "visible";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 5) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "visible";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 6) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "visible";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 7) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "visible";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 8) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "visible";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 9) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "visible";
        } else {
          console.log("error")
        }
      }
    }

    function changePageNext() {
      if (currentpage !== 9) {
        currentpage++;
        if (currentpage == 1) {
          page_1.style.visibility = "visible";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 2) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "visible";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 3) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "visible";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 4) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "visible";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 5) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "visible";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 6) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "visible";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 7) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "visible";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 8) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "visible";
          page_9.style.visibility = "hidden";
        } else if (currentpage == 9) {
          page_1.style.visibility = "hidden";
          page_2.style.visibility = "hidden";
          page_3.style.visibility = "hidden";
          page_4.style.visibility = "hidden";
          page_5.style.visibility = "hidden";
          page_6.style.visibility = "hidden";
          page_7.style.visibility = "hidden";
          page_8.style.visibility = "hidden";
          page_9.style.visibility = "visible";
        } else {
          console.log("error")
        }
      }
    }
    
    const prevBtns = document.getElementById("prevBtn");
    prevBtns.addEventListener("click", changePagePrev );

    const nextBtns = document.getElementById("nextBtn");
    nextBtns.addEventListener("click", changePageNext );
    
    const prevBtns2 = document.getElementById("prevBtn2");
    prevBtns2.addEventListener("click", changePagePrev );

    const nextBtns2 = document.getElementById("nextBtn2");
    nextBtns2.addEventListener("click", changePageNext );

    const prevBtns3 = document.getElementById("prevBtn3");
    prevBtns3.addEventListener("click", changePagePrev );

    const nextBtns3 = document.getElementById("nextBtn3");
    nextBtns3.addEventListener("click", changePageNext );

    const prevBtns4 = document.getElementById("prevBtn4");
    prevBtns4.addEventListener("click", changePagePrev );

    const nextBtns4 = document.getElementById("nextBtn4");
    nextBtns4.addEventListener("click", changePageNext );

    const prevBtns5 = document.getElementById("prevBtn5");
    prevBtns5.addEventListener("click", changePagePrev );

    const nextBtns5 = document.getElementById("nextBtn5");
    nextBtns5.addEventListener("click", changePageNext );

    const prevBtns6 = document.getElementById("prevBtn6");
    prevBtns6.addEventListener("click", changePagePrev );

    const nextBtns6 = document.getElementById("nextBtn6");
    nextBtns6.addEventListener("click", changePageNext );

    const prevBtns7 = document.getElementById("prevBtn7");
    prevBtns7.addEventListener("click", changePagePrev );

    const nextBtns7 = document.getElementById("nextBtn7");
    nextBtns7.addEventListener("click", changePageNext );

    const prevBtns8 = document.getElementById("prevBtn8");
    prevBtns8.addEventListener("click", changePagePrev );

    const nextBtns8 = document.getElementById("nextBtn8");
    nextBtns8.addEventListener("click", changePageNext );

    const prevBtns9 = document.getElementById("prevBtn9");
    prevBtns9.addEventListener("click", changePagePrev );

  ` }] });
const $$Astro$1 = createAstro("/D:/repos/medicine/src/pages/sabias.astro", "", "file:///D:/repos/medicine/");
const $$Sabias = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Sabias;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sabias que | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="w-screen h-72" style="background-image: url('https://media.discordapp.net/attachments/577998542149386253/1031382594006306876/unknown.png?width=1006&height=671');">
  </div><div class="md:px-56">
    <div class="h-[120vh]">
      <div class="grid-rows-2 absolute mx-auto h-[60rem] md:inset-5 md:top-[40%] w-screen xl:w-[80%] 2xl:w-[70%] px-0 lg:px-16">
        <div class="relative">
          <!-- Slide 1 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page1">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">vasoconstricción en bajas temperaturas</h1>
            <p>Nuestros vasos sanguines pueden estrecharse debido a cambio climáticos de muy bajas temperaturas; este fenómeno también se conoce como vasoconstricción. Este proceso sirve para evitar la pérdida de calor y la producción de sudor, por eso cuando hay situaciones de mucho frío el músculo del vaso se contrae de tal manera que ayuda a compensar los cambios en la temperatura corporal. (1)</p>
            <br>
            <p>Entonces, ¿qué pasa cuando hay vasoconstricción? lo que sucede es que el paso de sangre de estrecha por el conducto vascular, lo que conlleva a disminuir el flujo sanguíneo y de este modo los componentes sanguines se concentran en los órganos vitales, es decir corazón, riñones, hígado y cerebro; con esto queremos dar a entender que producen es un aumento de la presión arterial, el problema es que, si no es regulada la temperatura, generara una disminución en la frecuencia cardiaca y respiratoria. (1)</p>
            <br>
            <p>Por otro lado, la presión arterial también puede verse afectada por un cambio repentino en los patrones meteorológicos, como un frente o una tormenta. El cuerpo (y los vasos sanguíneos) pueden reaccionar a los cambios abruptos de humedad, presión atmosférica, nubosidad o viento de la misma manera que reacciona al frío. Estas variaciones en la presión arterial relacionadas con el tiempo son más frecuentes en las personas mayores de 65 años. (2)</p>
            <br>
            <p>Otras causas estacionales de una mayor presión arterial incluyen el aumento de peso y la menor cantidad de actividad física, que son frecuentes en el invierno, y los alimentos salados que se suelen ingerir durante las vacaciones. (2)</p>

            <div class="mt-24 opacity-60">
              <p class="italic">
                1. Junquera R. Vasoconstricción [Internet]. Fisioterapia-online.com. FisioOnline; [citado el 24 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.fisioterapia-online.com/glosario/vasoconstriccion">https://www.fisioterapia-online.com/glosario/vasoconstriccion</a></span>
              </p>
              <br>
              <p class="italic">
                2. La presión arterial: ¿se ve afectada por el clima frío? [Internet]. Mayo Clinic. 2022 [citado el 24 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.mayoclinic.org/es-es/diseases-conditions/high-blood-pressure/expert-answers/blood-pressure/faq-20058250">https://www.mayoclinic.org/es-es/diseases-conditions/high-blood-pressure/expert-answers/blood-pressure/faq-20058250</a></span>
              </p>
            </div>

            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn" class="w-full h-full hidden bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 2 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page2">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Alteración en el equilibrio acido-base</h1>
            <p>Al no haber una excreción de iones ácidos (CO2), debió a las muy bajas temperaturas genera que se acumulen estos en la sangre, generando asi una acidosis respiratoria. La reversión súbita de la acidosis puede causar fibrilación ventricular (1) (La fibrilación ventricular es un tipo de ritmo cardíaco anormal (arritmia).</p>
            <br>
            <p>Durante la fibrilación ventricular, las señales cardíacas desorganizadas hacen que las cámaras cardíacas inferiores (ventrículos) se contraigan (tiemblen) inútilmente. Como resultado, el corazón no bombea sangre al resto del cuerpo), debido a la falta de oxigeno al miocardio, este es el musculo encargado de impulsar la sangre a todo el cuerpo mediante su contracción. (2)</p>
            <div class="mt-24 opacity-60">
              <p class="italic">
                1. Acción general del frío sobre el organismo humano. « Fisiopatología (•) [Internet]. Apunts.org. [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.apunts.org/index.php?p=revista&tipo=pdf-simple&pii=X0213371779046790&r=276">https://www.apunts.org/index.php?p=revista&tipo=pdf-simple&pii=X0213371779046790&r=276</a></span>
              </p>
              <br>
              <p class="italic">
                2. Fibrilación ventricular [Internet]. Mayoclinic.org. 2021 [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.mayoclinic.org/es-es/diseases-conditions/ventricular-fibrillation/symptoms-causes/syc-20364523">https://www.mayoclinic.org/es-es/diseases-conditions/ventricular-fibrillation/symptoms-causes/syc-20364523</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn2" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn2" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 3 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page3">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Técnica de hipotermia</h1>
            <p>Esta técnica se trata de someter la paciente a una hipotermia inducida para enfriar el cuerpo de su temperatura normal de 37ºC a sólo 18ºC.</p>
            <br>
            <p>El enfriamiento se realiza a través de una máquina de hipotermia, que controla automáticamente la temperatura deseada del agua circulante en su interior, y que tiene un circuito de entrada y salida, con dos mangueras, dirigida a una manta térmica colocada por debajo del cuerpo del paciente, para establecer la recirculación del agua fría o caliente, y que a su vez presenta otra derivación conectada a un circuito de manguera, que se une a la entrada y salida del intercambiador de calor, localizado en la parte inferior del oxigenador, que permite el enfriamiento o calentamiento de la sangre del paciente, mientras circula a través del circuito extracorpóreo. (1)</p>
            <br>
            <p>Asi permitiendo superar dificultades para operar en un corazón con latido.</p>
            <br>
            <p>Los médicos explican que, al someter al paciente con esta técnica, queda en un estado similar a alguien que ha muerto. “El cuerpo en esencia queda en un estado de animación suspendida, sin pulso, sin presión arterial, sin signos de actividad cerebral" explica a la BBC el doctor John Elefteriades, cirujano cardiovascular que participa en la investigación. (2)</p>
            <br>
            <p>Por otra parte, esta técnica tiene como objetivo, es mientras se mantiene frio disminuyen los procesos corporales, y asi los cirujanos tienen mayor facilidad para poder hacer la operación, antes de que se llegue a el riesgo de daño cerebral (ya que, si no llega sangre adecuadamente al cerebro, puede ocasionar daños permanentes). Una vez se completa la cirugía se calienta al paciente, y se reinicia su función cardiaca con un desfibrilador. (2)</p>
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Echevarría JRL. Técnicas de Hipotermia aplicadas en la cirugía cardiovascular con circulación extracorpórea. Rev cuba cardiol cir cardiovasc [Internet]. 2016 [citado el 22 de octubre de 2022];22(2):102–7. Disponible en: <span><a class="text-red-900 font-bold" href="http://www.revcardiologia.sld.cu/index.php/revcardiologia/article/view/642/html_43">http://www.revcardiologia.sld.cu/index.php/revcardiologia/article/view/642/html_43</a></span>
              </p>
              <br>
              <p class="italic break-all">
                2. BBC News Mundo. Técnica que “mata” y resucita con hipotermia. BBC [Internet]. el 28 de septiembre de 2010 [citado el 22 de octubre de 2022]; Disponible en: <span><a class="text-red-900 font-bold" href="https://www.bbc.com/mundo/noticias/2010/09/100928_hipotermia_cirugia_men">https://www.bbc.com/mundo/noticias/2010/09/100928_hipotermia_cirugia_men</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn3" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn3" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 4 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page4">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Alteración en las enzimas</h1>
            <p>Las enzimas son muy sensibles a la temperatura, esto puede afectar en que tan rápido catalice la reacción que convierte un sustrato en un producto. A bajas temperaturas, la mayor parte de las enzimas muestras una muy poca actividad, ya que no hay suficiente cantidad de energía para que tenga lugar la reacción catalizada, por esto es de vital importancia que a pesar de vivir o estar en zonas muy frías es necesario abrigarnos, ya que las enzimas cumplen papeles muy importante a nivel molecular, ya que participan en sin número de reacciones metabólicas de vital importancia para la vida, como el ciclo de Krebs, que gracias se liberan grandes cantidades de electrones y protones que serán transportados hacia la cadena respiratoria además de la producción de ATP(1).</p>
            <br>
            
            <p>La mayoría de las enzimas humanas son más activas a temperatura óptima, que es de 37°C, o temperatura corporal. A temperaturas superiores a 50°C, la estructura terciaria, y por ende la forma de la mayor parte de las proteínas, se destruye, lo que causa una pérdida de actividad enzimática. Otro dato curioso es que, por esta razón, el equipo en los hospitales y laboratorios se esteriliza en autoclaves donde las temperaturas altas desnaturalizan las enzimas que existen en las bacterias dañinas. Una fiebre corporal alta puede ayudar a desnaturalizar las enzimas existentes en las bacterias que causan la infección. (2)</p>

            <img src="../../public/enzimas.png" alt="" class="w-[50%] mt-16">
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. El ciclo de Krebs en el ejercicio clínico de la nutriología [Internet]. IIDENUT. 2020 [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.iidenut.org/instituto/2020/03/14/el-ciclo-de-krebs-en-el-ejercicio-clinico-de-la-nutriologia/">https://www.iidenut.org/instituto/2020/03/14/el-ciclo-de-krebs-en-el-ejercicio-clinico-de-la-nutriologia/ </a></span>
              </p>
              <br>
              <p class="italic break-all">
                2. Bio-Orgánica Q. Factores que afectan la actividad enzimática [Internet]. Edu.uy. [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://uruguayeduca.anep.edu.uy/sites/default/files/inline-files/Factores%20que%20afectan%20la%20actividad%20enzim%C3%A1tica.pdf">https://uruguayeduca.anep.edu.uy/sites/default/files/inline-files/Factores%20que%20afectan%20la%20actividad%20enzim%C3%A1tica.pdf</a></span>
              </p>
              <br>
              <p class="italic break-all">
                3. IMAGEN   Consejo de Educacion Tecnico profesional Universidad del trabajo del Uruguay. Factores que afectan la actividad enzimatica. <span><a class="text-red-900 font-bold" href="https://uruguayeduca.anep.edu.uy/sites/default/files/inline-files/Factores%20que%20afectan%20la%20actividad%20enzim%C3%A1tica.pdf">https://uruguayeduca.anep.edu.uy/sites/default/files/inline-files/Factores%20que%20afectan%20la%20actividad%20enzim%C3%A1tica.pdf</a></span>; 3B1-2020.
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn4" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn4" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 5 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page5">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">EN EL FRIO SE PROPAGAN MAS FACIL LOS VIRUS.</h1>
            <p>En invierno la gente se enferma con mucha más frecuencia y es por varios factores, como la falta de la ventilación natural, cuando hay mucho frio normalmente los lugares cerrados con calefacción son los más transitados debido a que lo que menos quieres es estar afuera con esa baja temperatura, por ende, al estar en lugares cerrados sin ventilación natural, es muy fácil la propagación de un. (2) Además, un estudio realizado por la universidad de Cardiff, en Gran Bretaña, llegó a la conclusión de que la exposición al frío ayuda a que el virus se inocule con mayor facilidad. Se hizo un experimento con 180 voluntarios. 90 introdujeron sus pies en agua fría (10ºC) y otros no. El resultado fue que el 29% de las personas que introdujeron sus pies en el agua fría, dijeron que tenían síntomas de resfriado, frente al 9% de los que no lo hicieron. Explicación que dieron: “al estar expuesto a bajas temperaturas, tu organismo tiende a retirar sangre de las zonas prescindibles, como la nariz. De ahí que, cuando hace frío, lo primero que se enfría son las manos, la nariz… Si dos personas tienen un rinovirus en su nariz, la probabilidad de que el virus prospere y se extienda es mayor en la persona expuesta al frío que en la que no lo está por esa misma razón. El menor flujo sanguíneo a la nariz supone una menor presencia de leucocitos y una mayor facilidad de expansión del virus.</p>
            <br>
            
            <p>Según Ellen F. Foxman y sus colegas de la Universidad de Yale, en EE. UU., demostraron que el rinovirus que ocasiona los constipados no es capaz de reproducirse a 37°C, la temperatura que suele presentar el interior del cuerpo, pero sí cuando el mercurio marca entre 33°C y 35°C. En esta franja térmica se sitúan las cavidades nasales cuando nos exponemos durante un tiempo largo al frío. Además, la respuesta del sistema inmune resulta menos eficiente en un ambiente gélido, por lo que ese fresco glacial nos deja desarmados ante un ataque viral.</p>

            <iframe width="560" height="315" class="mt-16 mx-auto max-w-full" src="https://www.youtube.com/embed/kzDMCb3823g" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Hiperactina L. ¿Puede el FRÍO causar un RESFRIADO? | La Hiperactina [Internet]. Youtube; 2019 [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=kzDMCb3823g">https://www.youtube.com/watch?v=kzDMCb3823g</a></span>
              </p>
              <br>
              <p class="italic break-all">
                2. COPE. Curiosidades científicas sobre el frío [Internet]. COPE.es. 2020 [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.cope.es/emisoras/pais-vasco/noticias/curiosidades-cientificas-sobre-frio-20200113_592142">https://www.cope.es/emisoras/pais-vasco/noticias/curiosidades-cientificas-sobre-frio-20200113_592142</a></span>
              </p>
              <br>
              <p class="italic break-all">
                3.    Hiperactiva L. ¿Puede el FRÍO causar un RESFRIADO? [Internet]. España: Medicina; 3/feb/2019. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.youtube.com/watch?v=kzDMCb3823g&ab_channel=LaHiperactina">https://www.youtube.com/watch?v=kzDMCb3823g&ab_channel=LaHiperactina</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn5" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn5" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 6 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page6">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">PILOERECCION.</h1>
            <p>La piloerección o también conocida común mente como la piel de gallina, es cuando se nos erizan los vellos, sea por frio, emociones o algún rose con alguien.</p>
            <br>
            
            <p>La piloerección es un fenómeno fisiológico que se desencadena involuntaria mete por el sistema nervioso simpático. Este consiste en la contracción de los músculos erectores del pelo; estos con la función de que los vellos se ericen. La reacción de poner los pelos de punta como respuesta al frío es un reflejo es porque los pelos erectos permiten atrapar el aire y crean una capa de aislamiento que ayuda a proteger de las bajas temperaturas. (1)</p>

            <img src="../../public/piel-gallina.png" alt="" class="w-[70%] mt-16 mx-auto">
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Sánchez E. ¿Sabes qué es la piloerección? [Internet]. Mejor con Salud. 2019 [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://mejorconsalud.as.com/sabes-que-es-la-piloereccion/">https://mejorconsalud.as.com/sabes-que-es-la-piloereccion/</a></span>
              </p>
              <br>
              <p class="italic break-all">
                2. Universidad Pontificia de México. ¿Por qué se nos pone la piel de gallina? <span><a class="text-red-900 font-bold" href="https://web.facebook.com/UPMinerva/photos/a.1781750815484503/2960276707631902/?_rdc=1&_rdr">https://web.facebook.com/UPMinerva/photos/a.1781750815484503/2960276707631902/?_rdc=1&_rdr</a></span>; 2021. (IMAGEN)
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn6" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn6" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 7 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page7">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">HIPOTALAMO COMO TERMO-REGULADOR.</h1>
            <p>La termorregulación es un proceso natural del cuerpo que consiste en la activación de mecanismos centrales y periféricos para mantener la homeostasis corporal y las funciones vitales constantes. Su importancia está relacionada con la estabilidad de los procesos cardiovasculares, respiratorios, renales, endocrinos, nerviosos y el funcionamiento de los músculos, además, presenta vías complejas que permiten un vínculo estrecho entre estímulo y respuesta donde se involucran las vías aferentes y eferentes (1).</p>
            <br>
            <p>Estos mecanismos son controlados por el hipotálamo, este hace parte del encéfalo, este funciona a través de un sistema de retroalimentación, el cual permite aumento o disminución de la temperatura, en respuesta a el medio externo. </p>
            <br>
            <p>La información que reciben los receptores sensoriales térmicos (neuronas especializada, las cuales son sensibles al frio y al calor), estas detectan las sensaciones de temperaturas y asi envían impulsos ascendentes para llegar al encéfalo y exactamente al hipotálamo el cual enviara referencias (respuestas), para regular la temperatura, estos receptores se encuentran en piel, en la medula espinal, órganos internos y especialmente en la región posterior del hipotálamo, manteniendo como un valor de referencia una temperatura de 37ºC, al haber algún cambio este actuara para asi poder mantener una homeostasis o equilibrio en la temperatura corporal. (1)</p>

            <img src="../../public/control.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Picón-Jaimes YA, Orozco-Chinome JE, Molina-Franky J, Franky-Rojas MP. Control central de la temperatura corporal y sus alteraciones: fiebre, hipertermia e hipotermia. Medunab [Internet]. 2020 [citado el 22 de octubre de 2022];23(1):118–30. Disponible en: <span><a class="text-red-900 font-bold" href="https://revistas.unab.edu.co/index.php/medunab/article/view/3714/3219">https://revistas.unab.edu.co/index.php/medunab/article/view/3714/3219</a></span>
              </p>
              <br>
              <p class="italic break-all">
                2. <span class="font-bold">Figura 1:</span> Picón-Jaimes YA, Orozco-Chinome JE, Molina-Franky J, Franky-Rojas MP. Control central de la temperatura corporal y sus alteraciones: fiebre, hipertermia e hipotermia. Medunab [Internet]. 2020;23(1):118–30. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.redalyc.org/journal/719/71965088011/71965088011.pdf">https://www.redalyc.org/journal/719/71965088011/71965088011.pdf</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn7" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn7" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 8 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page8">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">Alteración de la membrana plasmática a bajas temperaturas.</h1>
            <p>La membrana plasmática también conocida como un mosaico fluido, representa el limite entre el medio extracelular e intracelular además actúa como una barreara selectiva para el paso de moléculas. Esta al estar en ambientes de bajas temperaturas, entra en un estado de alerta, generando cambios para mantener en un estado de equilibro en fluidez de ella, ya que esta tiene funciones vitales en la membrana como:</p>
            <ul>
              <li>Permite que las interacciones tengan lugar dentro de la membrana.</li>
              <li>Proporciona un compromiso perfecto entre una estructura rígida y ordenada en la que la movilidad estaría ausente, y un líquido fluido por completo, no viscoso, en el que los componentes de la membrana no se podrían orientar y la organización estructural y el soporte mecánico serían insuficientes (1).</li>
            </ul>
            <br>
            <p>Entonces colesterol presente en células eucariotas (es decir animales), refuerza la barrera semipermeable y colaboran en la fluidez de la membrana plasmática, por ello cuando hay bajas temperaturas el colesterol interfiere cadenas de ácidos grasos protegiendo a la membrana del congelamiento, en otras palabras. Previene que se compacten las cadenas hidrocarbonadas a bajas temperaturas, ya que evita que las colas se junten, aumenten las interacciones débiles entre las mismas y se “cristalicen” (adopten una estructura muy compacta (2).</p>
            
            <img src="../../public/membrana1.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
            
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Iwasa J, Marshall W, Karp G. Biología celular y molecular: conceptos y experimentos. México Etc.: Mcgraw-Hill; 2019.
              </p>
              <br>
              <p class="italic break-all">
                <span class="font-bold">Imagen:</span> De Shigeo Takamori, et al. CortesDe Shigeo Takamori, et al. Cortesía de Reinhard Jahn, Cell 2006;127:841, reimpreso con permiso de Elseviería de Reinhard Jahn, Cell 2006;127:841, reimpreso con permiso de Elsevier‌ 
              </p>
              <br>
              <p class="italic break-all">
                2. PerezMariaAleja_2013_VMEMBRANAPLASMATICA_BiologiaCelular%20.pdf. [citado el 22 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="http://PerezMariaAleja_2013_VMEMBRANAPLASMATICA_BiologiaCelular%20.pdf">http://PerezMariaAleja_2013_VMEMBRANAPLASMATICA_BiologiaCelular%20.pdf</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn8" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
              <div class="w-full h-full">
                <button id="nextBtn8" class="w-full h-full bg-blue-800 hover:bg-blue-700 text-white font-bold">Siguiente</button>
              </div>
            </div>
          </div>

          <!-- Slide 9 -->
          <div class="text-justify w-screen md:w-[100%] absolute bg-white px-8 md:px-24 xl:px-32 pb-32" id="page9">
            <div class="h-48 flex justify-center align-middle ">
              <p class="text-2xl font-bold my-auto opacity-40">#SabiasQue</p>
            </div>
            <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">La importancia de la sal (NaCI) en la regulación de la presión arterial.</h1>
            <p>En estudios experimentales se ha demostrado que el aumento de la ingesta de sal eleva más la presión arterial que el aumento de la ingestión de agua; esto debido a que el agua se excreta normalmente por los riñones, casi con la misma velocidad en la que se ingiere, en cambio la san no se excreta tan fácilmente. (1)</p>
            <p>Cuando se acumula la sal en el organismo asi mismo aumenta indirectamente el volumen del líquido extracelular, esto debido a dos razones. </p>
            <br>
            <img src="../../public/artt.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
            <br>
            <ul>
              <li>1.    Cuando hay exceso de NaCl (sal) en el líquido extracelular, aumentara la osmolalidad del líquido, generando un estímulo al centro de la sed en el cerebro, generando que la persona desee tomar cantidades extras de agua, para nivelar la concentración extracelular de sal, aumentando asi el volumen del líquido extracelular. (1)</li>
              <br>
              <li>2.    Aumento de la osmolalidad causado por el exceso de la sal en el líquido extracelular también estimula el mecanismo secreto del eje hipotálamo-hipófisis de hormona antidiurética, esta hormona provoca una reabsorción renal de cantidades mucho mayores de agua del líquido tubular renal, lo que disminuye el volumen excretado de orina, pero aumenta el volumen del líquido extracelular. (1)</li>
            </ul>
            
            <div class="mt-24 opacity-60">
              <p class="italic break-all">
                1. Hall JE. Guyton y Hall. Tratado de Fisiologia Medica + Studentconsult. 12a ed. Elsevier; 2016.
              </p>
              <br>
              <p class="italic break-all">
                2. <span class="font-bold">Imagen CDC.</span>  presion arterial [Internet]. unsplash; Publicado el 16 de septiembre de 2021. Disponible en: <span><a class="text-red-900 font-bold" href="https://unsplash.com/es/fotos/R4VUajOucGM">https://unsplash.com/es/fotos/R4VUajOucGM</a></span>
              </p>
            </div>
            <div class="grid grid-cols-2 h-16 mt-16 auto-cols-max items-center">
              <div class="w-full h-full">
                <button id="prevBtn9" class="w-full h-full bg-blue-900 hover:bg-blue-800 text-white font-bold">Anterior</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>` })}`;
});

const $$file$1 = "D:/repos/medicine/src/pages/sabias.astro";
const $$url$1 = "/sabias";

const _page15 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$1,
	default: $$Sabias,
	file: $$file$1,
	url: $$url$1
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata = createMetadata("/D:/repos/medicine/src/pages/ph.astro", { modules: [{ module: $$module1, specifier: "../layouts/Layout.astro", assert: {} }, { module: $$module2, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro = createAstro("/D:/repos/medicine/src/pages/ph.astro", "", "file:///D:/repos/medicine/");
const $$Ph = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Ph;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\xBFQu\xE9 es pH? | AVA" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="text-justify bg-white px-8 md:px-24 xl:px-48 pb-32" id="page1">
        <div class="h-48 flex justify-center align-middle ">
            <p class="text-2xl font-bold my-auto opacity-40">Conoce mas</p>
        </div>
        <h1 class="text-xl sm:text-3xl md:text-5xl font-extrabold my-auto pb-12 uppercase text-left">¿Qué es pH?</h1>
        <p>Se trata de un valor utilizado con él objetivó de medir la alcalinidad (base) o acidez de una determinada sustancia, indicando el porcentaje de hidrógeno que encontramos en ella, midiendo la cantidad de iones ácidos (H+) [1].</p>
        <br>
        <img src="../../public/ph2.png" alt="" class="w-full md:w-[70%] my-8 mx-auto">
        <br>
        <p>Te dejamos una imagen para que sepas cuál es el nivel de pH que deberías tener, la idea es siempre tenerlo en neutro, ni muy ácido, ni muy alcalino, ya que puede alterar tu organismo y causar hasta la muerte en niveles muy excesivos de los dos polos.</p>
        <img src="../../public/ph.png" alt="" class="w-full md:w-[40%] my-8 mx-auto">

        <div class="mt-24 opacity-60 w-full">
            <p class="italic">
            1. del Estado I de S y. SS de LT. El equilibrio del PH en el organismo [Internet]. gob.mx. [citado el 29 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://www.gob.mx/issste/articulos/el-equilibrio-del-ph-en-el-organismo?idiom=es">https://www.gob.mx/issste/articulos/el-equilibrio-del-ph-en-el-organismo?idiom=es</a></span>
            </p>
            <br>
            <p class="italic">
            2. Imagen de pH M. Qué es el pH y como se puede medir [Internet]. Medidordeph.com. medidordepH.com; 2013 [citado el 29 de octubre de 2022]. Disponible en: <span><a class="text-red-900 font-bold" href="https://medidordeph.com/blog/2013/11/que-es-ph/">https://medidordeph.com/blog/2013/11/que-es-ph/</a></span>
            </p>
        </div>
    </div>${renderComponent($$result, "Footer", $$Footer, {})}` })}`;
});

const $$file = "D:/repos/medicine/src/pages/ph.astro";
const $$url = "/ph";

const _page16 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata,
	default: $$Ph,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const pageMap = new Map([['src/pages/index.astro', _page0],['src/pages/sistema-cardio-respiratorio.astro', _page1],['src/pages/sistema-respiratorio.astro', _page2],['src/pages/potencial-corazon.astro', _page3],['src/pages/cambio-climatico.astro', _page4],['src/pages/latam-europa.astro', _page5],['src/pages/termogenico.astro', _page6],['src/pages/acido-base.astro', _page7],['src/pages/colombia.astro', _page8],['src/pages/cuidados.astro', _page9],['src/pages/glosario.astro', _page10],['src/pages/nosotras.astro', _page11],['src/pages/corazon.astro', _page12],['src/pages/podcast.astro', _page13],['src/pages/celula.astro', _page14],['src/pages/sabias.astro', _page15],['src/pages/ph.astro', _page16],]);
const renderers = [Object.assign({"name":"astro:jsx","serverEntrypoint":"astro/jsx/server.js","jsxImportSource":"astro"}, { ssr: server_default }),Object.assign({"name":"@astrojs/vue","clientEntrypoint":"@astrojs/vue/client.js","serverEntrypoint":"@astrojs/vue/server.js"}, { ssr: _renderer1 }),];

export { pageMap, renderers };
