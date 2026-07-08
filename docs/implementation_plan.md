# Home Page Layout Optimization & Mascot Re-evaluation

Following your feedback that the ARAM Poro Mascot widget takes up too much space and detracts from the home page aesthetic, we will optimize the layout by reclaiming this screen space.

## User Review Required

We propose the following layout restoration and options:
1. **Revert Grid Layout:** Revert the main home page grid from `grid-3` back to a clean `grid-2`. This restores the next-match countdown on the left and the tournament rules/format card on the right, which clean-aligns the priority content.
2. **ARAM Mascot Placement Options:**
   - **Option A (Clean Removal - Recommended):** Remove the interactive Poro Snax Mascot and its local storage state code completely. This ensures the site remains clean and distraction-free.
   - **Option B (Tiny Footer Easter Egg):** Move the Poro to the bottom footer as a tiny (`32px` wide) inline SVG beside the copyright notice, wiggling only when hovered, taking up zero priority screen space.

---

## Proposed Changes

### Component-Level Adaptations

#### [MODIFY] [page.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/app/page.js)
- Restore state hooks (remove `fedCount`, `isWiggling`, `showHeart` if Option A is selected).
- Restore the main home page render block back to `className="grid-2"`.
- Remove the Poro Snax Card.
- Expand the rules list card back to its full width inside the right slot.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify standard syntax resolution.

### Manual Verification
- Verify that the home page grid is clean-aligned in two columns, and check that the mascot is either removed or placed in the footer according to the chosen option.
