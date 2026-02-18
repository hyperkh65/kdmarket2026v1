export const getMarkerSvg = (type: string, color: string, isVerified: boolean) => {
  const icons: Record<string, string> = {
    cafe: `<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,
    fish: `<path d="M23 12c-2.4 3-6.4 4-9.4 6-3.3-2-5.3-4-5-8 2.2-3 6.4-4 8.2 2 1.8-6 4.8-4 6.2 0Z"/><path d="M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>`,
    herbal: `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>`,
    veggie: `<path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM11.3 7.9c-1.3.4-2.1 1.7-1.8 3 .3 1.3 1.6 2.1 2.9 1.8 1.3-.3 2.1-1.6 1.8-2.9-.3-1.3-1.6-2-2.9-1.9Z"/>`, // Simplified Carrot
    food: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />`,
    truck: `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.68-2.68a1 1 0 0 0-.707-.293H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>`,
    meat: `<path d="M16 4c3.3 0 6 2.7 6 6v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-3.3 2.7-6 6-6h4Z"/><circle cx="12" cy="12" r="3"/>`, // Beef approx
    chef: `<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/>`,
    bag: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>`,
    mz: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3a7 7 0 0 1 3.5-3.3c.3.4.4.8.4 1.1z" />`,
    default: `<circle cx="12" cy="12" r="10" />`
  };

  const iconPath = icons[type] || icons.default;

  // Modern, Minimalist Circle Design (Aligned with Home Symbols)
  return `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="40" height="40">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Main Circle Body -->
      <circle cx="20" cy="20" r="16" fill="white" filter="url(#shadow)"/>
      <circle cx="20" cy="20" r="14" fill="${color}"/>
      
      <!-- White Ring for Contrast -->
      <circle cx="20" cy="20" r="14" stroke="white" stroke-width="1.5" stroke-opacity="0.2"/>

      <!-- Icon Centered -->
      <g transform="translate(10, 10) scale(0.83)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${iconPath}
        </svg>
      </g>

      <!-- Verified Check (Bottom Right) -->
      ${isVerified ? `
      <g transform="translate(26, 26)">
        <circle cx="6" cy="6" r="6" fill="#00C73C" stroke="white" stroke-width="1.5"/>
        <path d="M4 6L5.5 7.5L8.5 4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>` : ''}
    </svg>
  `;
};
