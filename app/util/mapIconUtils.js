import memoize from 'lodash/memoize';
import getSelector from './get-selector';
import glfun from './glfun';
import {
  BIKESTATION_ON,
  BIKESTATION_OFF,
  BIKESTATION_CLOSED,
} from './citybikes';
import { AlertSeverityLevelType } from '../constants';

/**
 * Corresponds to an arc forming a full circle (Math.PI * 2).
 */
const FULL_CIRCLE = Math.PI * 2;

/**
 * Return icon style, width and height for stop icons
 *
 * @param {string} type one of 'stop', 'citybike', 'hybrid'
 * @param {number} zoom
 */
export function getStopIconStyles(type, zoom) {
  const styles = {
    stop: {
      13: {
        style: 'small',
        width: 10,
        height: 10,
      },
      14: {
        style: 'large',
        width: 16,
        height: 22,
      },
      15: {
        style: 'large',
        width: 20,
        height: 27,
      },
      16: {
        style: 'large',
        width: 24,
        height: 33,
      },
    },
    hybrid: {
      13: {
        style: 'small',
        width: 10,
        height: 10,
      },
      14: {
        style: 'large',
        width: 17,
        height: 37,
      },
      15: {
        style: 'large',
        width: 21,
        height: 45,
      },
      16: {
        style: 'large',
        width: 25,
        height: 55,
      },
    },
    citybike: {
      13: {
        style: 'small',
        width: 10,
        height: 10,
      },
      14: {
        style: 'medium',
        width: 16,
        height: 22,
      },
      15: {
        style: 'medium',
        width: 20,
        height: 27,
      },
      16: {
        style: 'large',
        width: 34,
        height: 43,
      },
    },
  };

  if (!styles[type]) {
    return null;
  }
  if (zoom < 13) {
    return null;
  }
  if (zoom > 16) {
    return styles[type][16];
  }
  return styles[type][zoom];
}

/**
 * Get width and height for terminal icons
 *
 * @param {number} zoom
 */
export function getTerminalIconStyles(zoom) {
  const styles = {
    12: {
      width: 12,
      height: 12,
    },
    13: {
      width: 16,
      height: 16,
    },
    14: {
      width: 20,
      height: 20,
    },
    15: {
      width: 24,
      height: 24,
    },
    16: {
      width: 30,
      height: 30,
    },
  };

  if (zoom < 12) {
    return styles[12];
  }
  if (zoom > 16) {
    return styles[16];
  }
  return styles[zoom];
}

export const getCaseRadius = memoize(
  glfun({
    base: 1.15,
    stops: [[11.9, 0], [12, 1.5], [22, 26]],
  }),
);

export const getStopRadius = memoize(
  glfun({
    base: 1.15,
    stops: [[11.9, 0], [12, 1], [22, 24]],
  }),
);

export const getHubRadius = memoize(
  glfun({
    base: 1.15,
    stops: [[14, 0], [14.1, 2], [22, 20]],
  }),
);

export const getMapIconScale = memoize(
  glfun({
    base: 1,
    stops: [[13, 0.8], [20, 1.6]],
  }),
);

const getStyleOrDefault = (selector, defaultValue = {}) => {
  const cssRule = selector && getSelector(selector.toLowerCase());
  return (cssRule && cssRule.style) || defaultValue;
};

export const getColor = memoize(selector => getStyleOrDefault(selector).color);

export const getFill = memoize(selector => getStyleOrDefault(selector).fill);

export const getModeColor = mode => getColor(`.${mode}`);

function getImageFromSpriteSync(icon, width, height, fill) {
  if (!document) {
    return null;
  }
  const symbol = document.getElementById(icon);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  const vb = symbol.viewBox.baseVal;
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);

  // TODO: Simplify after https://github.com/Financial-Times/polyfill-service/pull/722 is merged
  Array.prototype.forEach.call(symbol.childNodes, node => {
    const child = node.cloneNode(true);
    if (node.style && !child.attributes.fill) {
      child.style.fill = fill || window.getComputedStyle(node).color;
    }
    svg.appendChild(child);
  });

  const image = new Image(width, height);
  image.src = `data:image/svg+xml;base64,${btoa(
    new XMLSerializer().serializeToString(svg),
  )}`;
  return image;
}

function getImageFromSpriteAsync(icon, width, height, fill) {
  return new Promise(resolve => {
    // TODO: check that icon exists using MutationObserver
    const image = getImageFromSpriteSync(icon, width, height, fill);
    image.onload = () => resolve(image);
  });
}

const getImageFromSpriteCache = memoize(
  getImageFromSpriteAsync,
  (icon, w, h, fill) => `${icon}_${w}_${h}_${fill}`,
);

function drawIconImage(image, tile, geom, width, height) {
  tile.ctx.drawImage(
    image,
    geom.x / tile.ratio - width / 2,
    geom.y / tile.ratio - height / 2,
  );
}

function calculateIconBadgePosition(
  coord,
  tile,
  imageSize,
  badgeSize,
  scaleratio,
) {
  return coord / tile.ratio - imageSize / 2 - badgeSize / 2 + 2 * scaleratio;
}

function drawIconImageBadge(
  image,
  tile,
  geom,
  imageSize,
  badgeSize,
  scaleratio,
) {
  tile.ctx.drawImage(
    image,
    calculateIconBadgePosition(geom.x, tile, imageSize, badgeSize, scaleratio),
    calculateIconBadgePosition(geom.y, tile, imageSize, badgeSize, scaleratio),
  );
}

/**
 * Draw a small circle icon used for far away zoom level.
 */
function getSmallStopIcon(type, radius) {
  // draw on a new offscreen canvas so that result can be cached
  const canvas = document.createElement('canvas');
  const width = radius * 2;
  canvas.width = width;
  canvas.height = width;
  const x = width / 2;
  const y = width / 2;
  const ctx = canvas.getContext('2d');
  // outer circle
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(x, y, radius, 0, FULL_CIRCLE);
  ctx.fill();
  // inner circle
  ctx.beginPath();
  ctx.fillStyle = getModeColor(type);
  if (type === 'FERRY') {
    // different color for srops only
    ctx.fillStyle = '#666666';
  }
  ctx.arc(x, y, radius - 1, 0, FULL_CIRCLE);
  ctx.fill();

  return new Promise(r => r(canvas));
}

const getMemoizedStopIcon = memoize(
  getSmallStopIcon,
  (type, radius) => `${type}_${radius}`,
);

// function getSelectedIconCircleOffset(zoom, ratio) {
//   if (zoom > 15) {
//     return 94 / ratio;
//   }
//   if (zoom === 15) {
//     return 78 / ratio;
//   }
//   return 63 / ratio;
// }

/**
 * Draw stop icon based on type.
 * Determine size from zoom level.
 * Supported icons are BUS, TRAM, FERRY
 */
export function drawStopIcon(tile, geom, type, platformNumber) {
  const zoom = tile.coords.z - 1;
  const drawNumber = zoom >= 16;
  const styles = getStopIconStyles('stop', zoom);
  if (!styles) {
    return;
  }
  const { style } = styles;
  let { width, height } = styles;
  width *= tile.scaleratio;
  height *= tile.scaleratio;

  const radius = width / 2;
  let x;
  let y;
  if (style === 'small') {
    x = geom.x / tile.ratio - radius;
    y = geom.y / tile.ratio - radius;
    getMemoizedStopIcon(type, radius).then(image => {
      tile.ctx.drawImage(image, x, y);
    });
    return;
  }
  if (style === 'large') {
    x = geom.x / tile.ratio - width / 2;
    y = geom.y / tile.ratio - height;
    getImageFromSpriteCache(
      `icon-icon_stop_${type.toLowerCase()}`,
      width,
      height,
    ).then(image => {
      tile.ctx.drawImage(image, x, y);
      if (drawNumber && platformNumber) {
        x += radius;
        y += radius;
        tile.ctx.beginPath();
        /* eslint-disable no-param-reassign */
        tile.ctx.fillStyle = getModeColor(type);
        if (type === 'FERRY') {
          // ferry stops have different color than terminals
          tile.ctx.fillStyle = '#666666';
        }
        tile.ctx.arc(x, y, radius - 1, 0, FULL_CIRCLE);
        tile.ctx.fill();
        if (drawNumber && platformNumber) {
          tile.ctx.font = `${12 *
            tile.scaleratio}px Gotham XNarrow SSm A, Gotham XNarrow SSm B, Gotham Rounded A, Gotham Rounded B, Arial, sans-serif`;
          tile.ctx.fillStyle = '#fff';
          tile.ctx.textAlign = 'center';
          tile.ctx.textBaseline = 'middle';
          tile.ctx.fillText(platformNumber, x, y);
        }
        /* eslint-enable no-param-reassign */
      }
    });
  }
}
/**
 * Draw icon for hybrid stops, meaning BUS and TRAM stop in the same place.
 * Determine icon size based on zoom level
 */
export function drawHybridStopIcon(tile, geom) {
  const zoom = tile.coords.z - 1;
  const styles = getStopIconStyles('hybrid', zoom);
  if (!styles) {
    return;
  }
  const { style } = styles;
  let { width, height } = styles;
  width *= tile.scaleratio;
  height *= tile.scaleratio;
  // only bus/tram hybrid exist
  if (style === 'small') {
    const radiusInner = 3;
    const radiusOuter = 5;
    const x = geom.x / tile.ratio;
    const y = geom.y / tile.ratio;
    // outer icon
    /* eslint-disable no-param-reassign */
    tile.ctx.beginPath();
    tile.ctx.fillStyle = '#fff';
    tile.ctx.arc(x, y, radiusOuter * tile.scaleratio, 0, FULL_CIRCLE);
    tile.ctx.fill();
    tile.ctx.beginPath();
    tile.ctx.fillStyle = getModeColor('TRAM');
    tile.ctx.arc(x, y, (radiusOuter - 1) * tile.scaleratio, 0, FULL_CIRCLE);
    tile.ctx.fill();
    // inner icon
    tile.ctx.beginPath();
    tile.ctx.fillStyle = '#fff';
    tile.ctx.arc(x, y, radiusInner * tile.scaleratio, 0, FULL_CIRCLE);
    tile.ctx.fill();
    tile.ctx.beginPath();
    tile.ctx.fillStyle = getModeColor('BUS');
    tile.ctx.arc(x, y, (radiusInner - 0.5) * tile.scaleratio, 0, FULL_CIRCLE);
    tile.ctx.fill();
    /* eslint-enable no-param-reassign */
  }
  if (style === 'large') {
    const x = geom.x / tile.ratio - width / 2;
    const y = geom.y / tile.ratio - height;
    getImageFromSpriteCache('icon-icon_map_hybrid_stop', width, height).then(
      image => {
        tile.ctx.drawImage(image, x, y);
      },
    );
  }
}

/**
 * Draw an icon for citybike stations, including indicator to show bike availability. Draw closed icon for closed stations
 * Determine icon size based on zoom level
 */
export function drawCitybikeIcon(tile, geom, state, bikesAvailable) {
  const zoom = tile.coords.z - 1;
  const styles = getStopIconStyles('citybike', zoom);
  const { style } = styles;
  let { width, height } = styles;
  width *= tile.scaleratio;
  height *= tile.scaleratio;
  if (!styles) {
    return;
  }
  const radius = width / 2;
  let x;
  let y;
  if (style === 'small') {
    x = geom.x / tile.ratio - radius;
    y = geom.y / tile.ratio - radius;
    getMemoizedStopIcon('CITYBIKE', radius).then(image => {
      tile.ctx.drawImage(image, x, y);
    });
    return;
  }
  let color = 'green';
  if (!bikesAvailable) {
    color = 'red';
  } else if (bikesAvailable <= 3) {
    color = 'yellow';
  }
  if (style === 'medium') {
    x = geom.x / tile.ratio - width / 2;
    y = geom.y / tile.ratio - height;
    let iconName = `icon-icon_citybike_station_${color}_small`;
    if (state === BIKESTATION_CLOSED || state === BIKESTATION_OFF) {
      iconName = 'icon-icon_citybike_station_closed_small';
    }
    getImageFromSpriteCache(iconName, width, height).then(image => {
      tile.ctx.drawImage(image, x, y);
    });
  }
  if (style === 'large') {
    const smallCircleRadius = 11 * tile.scaleratio;
    x = geom.x / tile.ratio - width + smallCircleRadius * 2;
    y = geom.y / tile.ratio - height;
    let iconName = `icon-icon_citybike_station_${color}_large`;
    if (state === BIKESTATION_CLOSED || state === BIKESTATION_OFF) {
      iconName = 'icon-icon_citybike_station_closed_large';
    }
    getImageFromSpriteCache(iconName, width, height).then(image => {
      tile.ctx.drawImage(image, x, y);
      x = x + width - smallCircleRadius;
      y += smallCircleRadius;
      if (bikesAvailable && state === BIKESTATION_ON) {
        /* eslint-disable no-param-reassign */
        tile.ctx.font = `${10.8 *
          tile.scaleratio}px Gotham XNarrow SSm A, Gotham XNarrow SSm B, Gotham Rounded A, Gotham Rounded B, Arial, sans-serif`;
        tile.ctx.fillStyle = '#fff';
        tile.ctx.textAlign = 'center';
        tile.ctx.textBaseline = 'middle';
        tile.ctx.fillText(bikesAvailable, x, y);
        /* eslint-enable no-param-reassign */
      }
    });
  }
}

/* eslint-disable no-param-reassign */
export function drawRoundIcon(tile, geom, type, customScale, platformNumber) {
  const scale = customScale || 1;
  const caseRadius = getCaseRadius(tile.coords.z) * scale;
  const stopRadius = getStopRadius(tile.coords.z) * scale;
  const hubRadius = getHubRadius(tile.coords.z) * scale;

  if (caseRadius > 0) {
    tile.ctx.beginPath();
    tile.ctx.fillStyle = '#fff';
    tile.ctx.arc(
      geom.x / tile.ratio,
      geom.y / tile.ratio,
      caseRadius * tile.scaleratio,
      0,
      FULL_CIRCLE,
    );
    tile.ctx.fill();

    tile.ctx.beginPath();
    tile.ctx.fillStyle = getModeColor(type);
    tile.ctx.arc(
      geom.x / tile.ratio,
      geom.y / tile.ratio,
      stopRadius * tile.scaleratio,
      0,
      FULL_CIRCLE,
    );
    tile.ctx.fill();

    if (hubRadius > 0) {
      tile.ctx.beginPath();
      tile.ctx.fillStyle = '#fff';
      tile.ctx.arc(
        geom.x / tile.ratio,
        geom.y / tile.ratio,
        hubRadius * tile.scaleratio,
        0,
        FULL_CIRCLE,
      );
      tile.ctx.fill();

      // The text requires 14 pixels in width, so we draw if the hub radius is at least half of that
      if (platformNumber && hubRadius > 7) {
        const { length } = `${platformNumber}`;
        const multiplier = (length > 3 && 1.2) || (length === 3 && 1.4) || 1.6;
        tile.ctx.font = `${multiplier *
          hubRadius *
          tile.scaleratio}px Gotham XNarrow SSm A, Gotham XNarrow SSm B, Arial, sans-serif`;
        tile.ctx.fillStyle = '#333';
        tile.ctx.textAlign = 'center';
        tile.ctx.textBaseline = 'middle';
        tile.ctx.fillText(
          platformNumber,
          geom.x / tile.ratio,
          geom.y / tile.ratio,
        );
      }
    }
  }

  return {
    iconRadius: stopRadius * tile.scaleratio,
  };
}

export const drawRoundIconAlertBadge = async (
  tile,
  geometry,
  iconRadius,
  alertSeverityLevel,
  getImage = getImageFromSpriteCache,
) => {
  if (!alertSeverityLevel) {
    return;
  }

  const iconSize = iconRadius * 2;
  const badgeSize = iconSize * 3 / 4;
  if (badgeSize < 7) {
    return;
  }

  const isCaution = alertSeverityLevel !== AlertSeverityLevelType.Info;
  const image = await getImage(
    `icon-icon_${isCaution ? 'caution-badge-with-halo' : 'info'}`,
    badgeSize,
    badgeSize,
    isCaution ? getFill(`.icon.caution`) : getColor('.icon.info'),
  );

  const badgeCoords = {
    x: geometry.x / tile.ratio - iconSize / 2 - badgeSize / 3,
    y: geometry.y / tile.ratio,
  };

  // draw a white background circle for the info icon as it's partially transparent
  if (!isCaution) {
    tile.ctx.beginPath();
    tile.ctx.fillStyle = '#fff';
    tile.ctx.arc(
      badgeCoords.x + badgeSize / 2,
      badgeCoords.y + badgeSize / 2,
      badgeSize / 2 + 1, // + 1 for a small halo effect
      0,
      FULL_CIRCLE,
    );
    tile.ctx.fill();
  }

  // draw the alert icon
  tile.ctx.drawImage(image, badgeCoords.x, badgeCoords.y);
};

export function drawTerminalIcon(tile, geom, type) {
  const zoom = tile.coords.z - 1;
  const styles = getTerminalIconStyles(zoom);
  if (!styles) {
    return;
  }
  let { width, height } = styles;
  width *= tile.scaleratio;
  height *= tile.scaleratio;
  getImageFromSpriteCache(
    `icon-icon_${type.split(',')[0].toLowerCase()}`,
    width,
    height,
  ).then(image => {
    tile.ctx.drawImage(
      image,
      geom.x / tile.ratio - width / 2,
      geom.y / tile.ratio - height / 2,
    );
  });
}

export function drawParkAndRideIcon(tile, geom, width, height) {
  getImageFromSpriteCache('icon-icon_park-and-ride', width, height).then(
    image => {
      drawIconImage(image, tile, geom, width, height);
    },
  );
}

export function drawCitybikeNotInUseIcon(
  tile,
  geom,
  imageSize,
  badgeSize,
  scaleratio,
) {
  return getImageFromSpriteCache(
    'icon-icon_not-in-use',
    badgeSize,
    badgeSize,
  ).then(image =>
    drawIconImageBadge(image, tile, geom, imageSize, badgeSize, scaleratio),
  );
}

export function drawAvailabilityBadge(
  availability,
  tile,
  geom,
  imageSize,
  badgeSize,
  scaleratio,
) {
  if (
    availability !== 'good' &&
    availability !== 'poor' &&
    availability !== 'no'
  ) {
    throw Error("Supported badges are 'good', 'poor', and 'no'");
  }

  getImageFromSpriteCache(
    `icon-icon_${availability}-availability`,
    badgeSize,
    badgeSize,
  ).then(image => {
    drawIconImageBadge(image, tile, geom, imageSize, badgeSize, scaleratio);
  });
}

export function drawIcon(icon, tile, geom, imageSize) {
  return getImageFromSpriteCache(icon, imageSize, imageSize).then(image => {
    drawIconImage(image, tile, geom, imageSize, imageSize);
  });
}

/* eslint-disable no-param-reassign */
export function drawAvailabilityValue(
  tile,
  geom,
  value,
  imageSize,
  badgeSize,
  scaleratio,
) {
  const radius = badgeSize / 2;
  const x =
    calculateIconBadgePosition(geom.x, tile, imageSize, radius, scaleratio) + 1;
  const y =
    calculateIconBadgePosition(geom.y, tile, imageSize, radius, scaleratio) + 1;

  tile.ctx.beginPath();
  tile.ctx.fillStyle =
    (value > 3 && '#4EA700') || (value > 0 && '#FF6319') || '#DC0451';
  tile.ctx.arc(x, y, radius, 0, FULL_CIRCLE);
  tile.ctx.fill();

  tile.ctx.font = `${0.7 * badgeSize}px
    Gotham XNarrow SSm A, Gotham XNarrow SSm B, Arial, sans-serif`;
  tile.ctx.fillStyle = '#fff';
  tile.ctx.textAlign = 'center';
  tile.ctx.textBaseline = 'middle';
  tile.ctx.fillText(value, x, y);
}

export const getZoneLabelColor = config => {
  if (typeof config.colors !== 'undefined' && config.colors.primary) {
    return config.colors.primary;
  }
  return '#000';
};

export const getZoneLabel = (zoneId, config) => {
  if (config.zoneIdMapping) {
    return config.zoneIdMapping[zoneId];
  }
  return zoneId;
};

export const getZoneLabelSize = (zoneId, config) => {
  if (
    config.zoneIdFontSize &&
    typeof config.zoneIdFontSize[zoneId] !== 'undefined'
  ) {
    return config.zoneIdFontSize[zoneId];
  }
  return '26px';
};
