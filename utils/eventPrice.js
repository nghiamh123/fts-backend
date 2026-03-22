export function computeEventPrice(product) {
  const p = { ...product };
  const event = p.eventId;
  if (!event || typeof event !== "object") {
    p.finalPrice = p.price;
    p.eventDiscount = null;
    return p;
  }

  const now = new Date();
  const started = new Date(event.startDate) <= now;
  const ended = new Date(event.endDate) < now;

  if (!event.isActive || ended) {
    p.finalPrice = p.price;
    p.eventDiscount = null;
    return p;
  }

  let discountedPrice = p.price;
  if (event.discountType === "percent") {
    discountedPrice = Math.round(p.price * (1 - event.discountValue / 100));
  } else if (event.discountType === "fixed") {
    discountedPrice = Math.max(0, p.price - event.discountValue);
  }

  if (started) {
    p.finalPrice = discountedPrice;
    p.eventDiscount = {
      eventId: event._id,
      eventName: event.name,
      discountType: event.discountType,
      discountValue: event.discountValue,
      originalPrice: p.price,
      status: "active",
    };
  } else {
    p.finalPrice = p.price;
    p.eventDiscount = {
      eventId: event._id,
      eventName: event.name,
      discountType: event.discountType,
      discountValue: event.discountValue,
      originalPrice: p.price,
      status: "upcoming",
      startDate: event.startDate,
      discountedPrice,
    };
  }

  return p;
}

export function applyEventPricing(products) {
  if (Array.isArray(products)) {
    return products.map(computeEventPrice);
  }
  return computeEventPrice(products);
}
