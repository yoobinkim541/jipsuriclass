export type NaverMapCoordinates = {
  lat: number;
  lng: number;
};

type NaverMapWindow = Window & {
  naver?: {
    maps?: {
      Map: new (element: HTMLElement | string, options?: Record<string, unknown>) => unknown;
      Marker: new (options?: Record<string, unknown>) => unknown;
      LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
      Service: {
        Status: {
          OK: string;
          ERROR: string;
        };
        geocode: (
          options: { query: string },
          callback: (status: string, response: { v2?: { addresses?: Array<{ x?: string; y?: string }> } }) => void
        ) => void;
      };
    };
  };
};

const scriptId = "naver-maps-sdk";
let loadPromise: Promise<void> | null = null;

function getWindow() {
  return window as NaverMapWindow;
}

export function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  return (
    /Mobi|Android|iPhone|iPod/i.test(userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(userAgent))
  );
}

export function getNaverMapAppName() {
  if (typeof window === "undefined") {
    return "https://www.jipsuriclass.kr";
  }

  return window.location.href.split("#")[0];
}

export function buildNaverMapSchemeUrl(
  actionPath: string,
  params: Record<string, string | number | undefined>
) {
  const filteredParams = Object.entries(params).filter(([, value]) => value !== undefined);
  const query = filteredParams.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&");
  const appname = `appname=${encodeURIComponent(getNaverMapAppName())}`;
  const suffix = query ? `${query}&${appname}` : appname;

  return `nmap://${actionPath}?${suffix}`;
}

export function buildNaverMapPlaceUrl(coords: NaverMapCoordinates, name: string) {
  return buildNaverMapSchemeUrl("place", {
    lat: coords.lat,
    lng: coords.lng,
    name
  });
}

export function buildNaverMapRouteUrl(
  mode: "public" | "car" | "walk" | "bike",
  coords: NaverMapCoordinates,
  name: string
) {
  return buildNaverMapSchemeUrl(`route/${mode}`, {
    dlat: coords.lat,
    dlng: coords.lng,
    dname: name
  });
}

export function buildNaverMapNavigationUrl(coords: NaverMapCoordinates, name: string) {
  return buildNaverMapSchemeUrl("navigation", {
    dlat: coords.lat,
    dlng: coords.lng,
    dname: name
  });
}

export function buildNaverMapsScriptUrl(clientId: string) {
  const query = new URLSearchParams({
    ncpKeyId: clientId,
    submodules: "geocoder"
  });

  return `https://oapi.map.naver.com/openapi/v3/maps.js?${query.toString()}`;
}

export function loadNaverMapsSdk(clientId: string) {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Naver Maps SDK can only load in the browser."));
      return;
    }

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript?.dataset.ready === "true") {
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Naver Maps SDK")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = buildNaverMapsScriptUrl(clientId);
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.ready = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Naver Maps SDK"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function geocodeNaverAddress(address: string) {
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

  if (!clientId) {
    throw new Error("Missing VITE_NAVER_MAP_CLIENT_ID");
  }

  await loadNaverMapsSdk(clientId);

  return new Promise<NaverMapCoordinates>((resolve, reject) => {
    const naver = getWindow().naver;
    const maps = naver?.maps;

    if (!maps) {
      reject(new Error("Naver Maps SDK is unavailable."));
      return;
    }

    maps.Service.geocode({ query: address }, (status, response) => {
      if (status !== maps.Service.Status.OK) {
        reject(new Error(`Geocoding failed: ${status}`));
        return;
      }

      const firstAddress = response.v2?.addresses?.[0];
      const lat = Number(firstAddress?.y);
      const lng = Number(firstAddress?.x);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        reject(new Error("Geocoding response missing coordinates."));
        return;
      }

      resolve({ lat, lng });
    });
  });
}
