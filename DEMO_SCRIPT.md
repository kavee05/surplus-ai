# Demo script: 5-minute screen recording

Setup before recording:
- Use the deployed link or `npm run build && npm start`.
- Desktop browser at about 1280 × 800, zoom 100%.
- Open the landing page. If you have used the app before, open the user menu and choose Reset demo data, then go back to the landing page.
- The Guided Demo resets the data itself when it starts.

| Time | Screen | What to do | What to say |
| --- | --- | --- | --- |
| 0:00 to 0:15 | Landing hero | Pause on the hero. Point at the Elmina marker and the diamond. | "Construction teams order with a buffer, so surplus is left at the end of every phase. Surplus AI forecasts it before it exists. Check before you buy." |
| 0:15 to 0:25 | Landing hero | Click **Try the guided demo**. | "This is a student prototype with simulated data. Here is one order, start to finish." |
| 0:25 to 0:50 | Radar, step 1 and 2 | Show the Pre-Order Check form, then the timeline. Hover the Elmina marker. | "Daniel buys for Bandar Bukit Raja and needs 1,000 floor tiles by 7 December. Radar sees that City of Elmina Phase 3 ordered 5,000 tiles but needs 4,200. It finishes on 23 November, so about 800 will be spare, at 0.70 confidence." |
| 0:50 to 1:20 | Radar, step 3 | Point at Reserve 800 and Order now 200, the decision date, then toggle **Conservative mode** on and off. Open **How this was calculated**. | "Recommendation: reserve 800, order only 200, and confirm by 24 November. A cautious buyer can use Conservative mode: reserve 560, order 440. Every number has its arithmetic. No black box." |
| 1:20 to 1:40 | Radar, step 4 | Click **Next** (it reserves 800). | "Daniel holds the 800 tiles. Elmina now knows a buyer is waiting, so they are not thrown away." |
| 1:40 to 2:20 | Log surplus, steps 5 and 6 | Click **Move the clock to 23 Nov**. Click the **Boxed floor tiles** sample. Show the AI suggestion, the confidence and the "estimated" label. Tick the confirmation box and **Save surplus**, or use **Log 820 tiles for me**. | "Three weeks later, Aina, the Elmina site engineer, photographs the leftover boxes. The AI suggests the item and an estimated 820 tiles. She checks and confirms. The AI only suggests; a person decides." |
| 2:20 to 2:45 | Inventory toast, then Transfers, step 7 | Click **Next**. Open the highlighted tile transfer to show the steps, then **Collect and complete**. | "820 is within 15% of the forecast, so it is marked Confirmed and the hold becomes a reservation. The transfer is collected and completed, and every step is recorded." |
| 2:45 to 3:15 | Impact, step 8 | Show RM saved, tonnes, CO2e (illustrative), forecast accuracy. Scroll to the charts and the scale view. | "Management sees the result: the saving from these tiles is counted, along with tonnes kept out of disposal. Forecast accuracy uses simulated history, clearly labelled." |
| 3:15 to 3:45 | Assumptions | Open Assumptions. Change **Maximum haul distance** to 10 km. Show the live check change to Reserve 0, Order 1,000. Set it back to 60. | "Every cost, carbon factor and threshold is an assumption with a source to confirm. Change one and the results update immediately." |
| 3:45 to 4:15 | Needs and Transfers | Open Needs, click the KL East plywood need, show ranked matches with explanations. Open a rebar transfer and show the engineer approval step. | "Surplus that already exists is matched to needs, ranked with plain explanations. Steel and other structural items cannot be reserved without engineer approval." |
| 4:15 to 4:40 | Evidence | Scroll the Evidence page, stop on Limits and Differentiation. | "Our evidence: GS E&C in Korea, Persimmon in the UK, a Malaysian practitioner survey and SDP's own reports, with their limits. Exchanges exist; we did not find one that forecasts surplus from purchase plans, but we only checked a few." |
| 4:40 to 5:00 | Pilot plan | Show the Pilot plan page. | "Next step: an 8-week pilot in one township with four materials, measuring RM saved, tonnes diverted, match rate and forecast accuracy. Nothing here is validated with SDP yet; that is what the pilot is for." |

Radar must be on screen within the first 60 seconds. In this script it appears at 0:00 on the landing page and in the app by 0:25.
