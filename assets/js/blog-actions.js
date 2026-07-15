(function () {
  "use strict";

  const root = document.querySelector("[data-blog-actions]");
  if (!root) return;

  const pageUrl = window.location.href.split("#")[0];
  const title = (document.querySelector("h1")?.textContent || document.title).trim();
  const description = document.querySelector('meta[name="description"]')?.content || "";
  const imageUrl = document.querySelector('meta[property="og:image"]')?.content || "";
  const slug = window.location.pathname.replace(/^\/blog-/, "").replace(/\.html\/?$/, "");
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };

  Object.entries(shareUrls).forEach(([name, href]) => {
    const link = root.querySelector(`[data-share="${name}"]`);
    if (link) link.href = href;
  });

  const copyButton = root.querySelector('[data-share="copy"]');
  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      const oldText = copyButton.textContent;
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = oldText; }, 1800);
    } catch {
      window.prompt("Copy this article link:", pageUrl);
    }
  });

  const nativeButton = root.querySelector('[data-share="native"]');
  if (nativeButton && navigator.share) {
    nativeButton.hidden = false;
    nativeButton.addEventListener("click", async () => {
      try {
        await navigator.share({ title, text: description, url: pageUrl });
      } catch (error) {
        if (error?.name !== "AbortError") window.prompt("Copy this article link:", pageUrl);
      }
    });
  }

  const likeButton = root.querySelector(".blog-like-button");
  const likeLabel = root.querySelector(".blog-like-label");
  const likeCount = root.querySelector("[data-like-count]");
  const likeStatus = root.querySelector("[data-like-status]");
  if (!likeButton || !likeCount || !slug) return;

  const clientStorageKey = "jasonArtsLikeClientId";
  const likedStorageKey = `jasonArtsLiked:${slug}`;
  let clientId;
  try {
    clientId = localStorage.getItem(clientStorageKey);
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem(clientStorageKey, clientId);
    }
  } catch {
    clientId = crypto.randomUUID();
  }

  function showLiked(count) {
    likeButton.classList.add("liked");
    likeButton.setAttribute("aria-pressed", "true");
    if (likeLabel) likeLabel.textContent = "Liked";
    if (Number.isFinite(count)) likeCount.textContent = count.toLocaleString();
    try { localStorage.setItem(likedStorageKey, "1"); } catch {}
  }

  function showCount(count) {
    likeCount.textContent = Number.isFinite(count) ? count.toLocaleString() : "0";
  }

  const apiUrl = `/api/likes?slug=${encodeURIComponent(slug)}&client=${encodeURIComponent(clientId)}`;
  fetch(apiUrl, { headers: { "Accept": "application/json" } })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Likes unavailable")))
    .then((data) => {
      if (data.liked) showLiked(Number(data.count));
      else showCount(Number(data.count));
    })
    .catch(() => {
      likeCount.textContent = "—";
      if (likeStatus) likeStatus.textContent = "Likes are temporarily unavailable.";
    });

  likeButton.addEventListener("click", async () => {
    if (likeButton.getAttribute("aria-pressed") === "true") {
      if (likeStatus) likeStatus.textContent = "Thanks for liking this article.";
      return;
    }
    likeButton.disabled = true;
    if (likeStatus) likeStatus.textContent = "Saving your like…";
    try {
      const response = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ clientId })
      });
      if (!response.ok) throw new Error("Like failed");
      const data = await response.json();
      showLiked(Number(data.count));
      if (likeStatus) likeStatus.textContent = "Thanks—your like was counted.";
    } catch {
      if (likeStatus) likeStatus.textContent = "Couldn’t save that like. Please try again.";
    } finally {
      likeButton.disabled = false;
    }
  });
})();
