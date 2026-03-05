/**
 * SkillZone founding date and dynamic years calculation.
 * Founded: 18. 2. 2005
 */

/** The exact date SkillZone was founded */
export const FOUNDING_DATE = new Date(2005, 1, 18); // 18. February 2005

/** Calculate how many full years SkillZone has been on the market */
export function getYearsOnMarket(): number {
    const now = new Date();
    let years = now.getFullYear() - FOUNDING_DATE.getFullYear();
    const monthDiff = now.getMonth() - FOUNDING_DATE.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < FOUNDING_DATE.getDate())) {
        years--;
    }
    return years;
}
