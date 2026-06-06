# Visual Asset Requirements

This document is the production inventory for raising Infinite Starwish from functional combat visuals to polished code-drawn pixel art. It is the checklist future visual TDD work should use before changing sprites, animations, Wishcraft effects, arena effects, or render modules.

The goal is not to copy the reference images in `docs/visual-reference/vampire-survivors/`. Those images define polish, density, readability, projectile saturation, and late-run energy. The actual style remains code-drawn neon space pixel art with HD-2D-like lighting, shader-style particles, cyberpunk mech bodies, and no imported runtime sprite sheets or AIGC assets.

## Production Rules

- Runtime art must be generated from TypeScript drawing code, Pixi graphics, procedural pixel templates, shader-like layers, or generated data that remains diffable.
- Visual systems must stay decoupled from mechanics. A Wishcraft can choose visual motifs, emitter sockets, particles, trails, and screen accents without changing damage, cooldown, targeting, movement, enemy AI, or XP rules.
- New visual work must enter focused modules. Do not add sprite factories, skill effect catalogs, particle systems, or asset inventories to `src/client/arena.ts`.
- Large visual domains should live under a directory before they become large files. Wishcraft skill effects should use `src/client/visual/wishcraft/`; entity sprites should continue moving toward `src/client/visual/sprites/` or a future `src/client/visual/entities/`.
- Every visual TDD issue should improve one asset package and add a small pure test for budgets, mapping, frame selection, or acceptance invariants.

## Asset Readiness Levels

- **Placeholder:** readable as gameplay state, but geometric, repeated, or effect-only.
- **Production pass 1:** sprite-like silhouette, family-specific animation, themed particles, and basic QA screenshot.
- **Production pass 2:** authored frame variation, hit/death/launch/fade states, mobile readability evidence.
- **Commercial target:** dense sprite construction, layered VFX, strong theme and mechanic identity, late-run readability, and desktop plus mobile screenshots.

No current asset package should be considered complete until it reaches at least Production pass 2 with screenshot evidence.

## Required Module Shape

Recommended near-term structure:

- `src/client/visual/primitives/`: pixel primitives, glow helpers, mechanical detail primitives, motif particles.
- `src/client/visual/entities/` or `src/client/visual/sprites/`: player, common enemies, bosses, summons, XP shards, animation frames.
- `src/client/visual/wishcraft/`: mechanic-family accents, theme motifs, launch emitters, projectile bodies, trails, impacts, particle clouds, screen pulses, shield shells, pickup magnet paths, summon firing.
- `src/client/visual/arena/`: background phase landmarks, double-Boss transitions, horizon layers, late-run field energy.
- `src/client/rendering/`: Pixi layer orchestration, cache synchronization, feedback lifetime pools.

Working threshold:

- A visual file over roughly 600 lines must either be clearly cohesive or split before more asset families are added.
- A new mechanic family, Boss state, enemy family, or shader-like layer should usually start as its own module with tests.

## Player Mech Asset Package

Required sprite anatomy:

- Humanoid mech body with helmet, visor, chest reactor, shoulders, arms, hips, knees, boots, and rear thrusters.
- Dark outline and inner shadow pixels so the body survives heavy particles.
- Three material values: dark shell, mid armor, bright neon emissive.
- Asymmetry through weapon mounts, shoulder pods, cables, heat sinks, small plates, and attachment sockets.

Required animation states:

- Idle hover, 4-6 frames.
- Movement thrust in eight directions, with exhaust opposite movement and subtle limb offsets.
- Machine-gun launch from a visible socket.
- Laser sword windup, active slash, and fade.
- Hit shield/armor flicker.
- Level-up flash and Wishcraft install snap-on.

Required Wishcraft integration:

- Attachments must mount to core, head, shoulder, arm, back, hip, weapon, aura, orbit, trail, projectile, impact, and summon slots.
- A newly awarded craft should visibly change the mech, even if the mechanic is passive.
- Visual pieces must not imply a different mechanic than the legal mechanic pieces provide.

Acceptance evidence:

- Desktop fresh run screenshot.
- Desktop 3+ Wishcraft loadout screenshot.
- Boss fight screenshot.
- Mobile portrait fresh run screenshot.
- Mobile portrait first-Wishcraft screenshot.

Current evidence:

- `artifacts/visual-polish/qa-player-mech-scene.png` isolates the player at large inspection scale across idle base, movement thrust, dense 5-Wishcraft loadout, armor hit flicker, Wishcraft install snap-on, and mobile portrait crop.
- `artifacts/visual-polish/qa-mobile-combat-scene.png` verifies the player silhouette, `Lv.xxx` label, player health bar, and bottom-center joystick stay readable in a real 390 x 844 portrait combat scene under dense enemies, Boss pressure, XP shards, summons, shield shell, and seven Wishcraft themes.
- `artifacts/visual-polish/qa-live-combat-spectacle-scene.png` verifies the player and HUD inside a late-run 1440 x 900 combat frame with 140+ enemies, double Boss pressure, XP shards, summons, and twelve Wishcraft themes active in the same render pass.
- `artifacts/visual-polish/qa-mobile-spectacle-scene.png` verifies the v33 player-readability field in a real 390 x 844 portrait late-run frame with bottom-center joystick, active Boss HUD, 100+ enemies, XP shards, summons, double-Boss pressure, twelve Wishcraft themes, and high-density reward VFX.
- `artifacts/visual-polish/qa-base-kit-weapon-scene.png` isolates the first authored base weapon animation pass and socket-origin pass: machine-gun windup/active/fade from forearm rails and laser-sword windup/active/fade from sword-hilt sockets.
- The v18 base-art pass covers dense armor breakup, asymmetric sockets, backpack vents, silhouette cut-ins, limb pose armor, and movement-derived thruster intensity.
- The v28 state-art pass adds six authored idle frame signatures, body-local hit flicker/shield sparks, and visual-only Wishcraft install rails/snap-on plates.
- The v33 player-readability pass adds a visual-only focus field under the player sprite so late-run VFX density can remain high while the mech, level label, and health bar stay anchored in the center of the screen.

Remaining gap:

- The player still needs live combat clip evidence showing idle frame cycling, hit flicker, Wishcraft install snap-on, and socket-origin base weapon VFX attached to the moving player sprite.
- Mobile late-run still evidence now exists for the readability field, but the player package is not yet Production pass 2 because idle, hit, install, and socket-origin base weapon states still need live motion proof under portrait particle saturation.

## Common Enemy Asset Packages

Common enemies must be small enough for survivor-like horde pressure, but they cannot read as simple tokens. Each family needs sprite-like construction, locomotion frames, hit frames, breakup fragments, and recent-Wishcraft drift sockets.

### Fast Fragile

Required silhouette:

- Small harrier or dart drone with pointed nose, side fins, exposed core, and tiny rear exhaust.
- Narrow profile that reads as fast.

Required animation:

- 4-frame hover/dart cycle with fin flicker and engine pulse.
- Hit flash frame with core blink.
- Death breakup into nose shard, wing panels, engine fragments, and theme-tinted micro debris.

Required drift integration:

- Recent Wishcraft pieces can appear as fin tint, small aura rings, side sparks, tail trail, or core color.

### Slow Tough

Required silhouette:

- Chunky crawler/blocker with heavy front armor, side plates, low body, and shield-like face.
- Wider profile that reads as durable.

Required animation:

- 4-frame heavy crawl or hover compression.
- Hit flash that exposes armor chips.
- Death breakup into larger armor plates, core crack, and heavy fragments with longer TTL.

Required drift integration:

- Recent Wishcraft pieces can appear as shield rim, armor cracks, shoulder pods, rear vents, or side nodes.

### Swarm Fragile

Required silhouette:

- Tiny bug/drone cluster with separated wing or limb pixels and a visible core.
- Many on screen without becoming unreadable.

Required animation:

- 4-frame flutter cycle with alternating wings or nodes.
- Hit flash with small body pop.
- Death breakup into several micro nodes and wing fragments.

Required drift integration:

- Recent Wishcraft pieces can appear as antenna glow, wing tint, small orbit specks, or trail pixels.

Common enemy acceptance:

- A still screenshot at horde density must distinguish all three families by shape, not only color.
- Four variants per family should remain deterministic and art-only.
- Recent-Wishcraft drift changes appearance without changing enemy health, speed, damage, or behavior.

Current evidence:

- `artifacts/visual-polish/qa-common-enemy-hit-scene.png` now renders real common-enemy sprites plus family-specific living hit-pose redraws, recent-Wishcraft drift pieces, and hit VFX for Fast Fragile, Slow Tough, and Swarm Fragile under machine-gun, laser-sword, and Wishcraft hit sources.
- The v24 hit-frame pass carries target template/radius as visual-only feedback hints and renders harrier wing-shear, slow armor buckle, and swarm node-disruption VFX without changing enemy mechanics.
- The v26 living hit-pose pass adds body-authored damage pieces: Fast Fragile wing shear and cracked core, Slow Tough buckled armor plates and hull cracks, and Swarm Fragile scattered node disruption.
- The v29 motion-art pass adds small-scale family motion layers under the body: Fast Fragile engine streaks, dart afterimage pixels, and fin flutter arcs; Slow Tough tread sparks, compression scrape marks, and vent puffs; Swarm Fragile micro-node jitter, flutter arcs, and tiny trail pixels.

Remaining gap:

- Hit and motion feedback still need validation at real horde density and mobile portrait scale.
- Common enemies still need live locomotion/death clips and tuning so body details survive late-run particle saturation without making horde units too large.

## Boss Asset Packages

Bosses share the visual assembly vocabulary with the player and common enemies, but their scale, particle richness, and anatomy must be more extreme. Boss base silhouettes are always dragon-mech inspired. Each encounter randomly uses one of three body plans.

### Flying Dragon Mech

Required anatomy:

- Horned head, long keel body, wings, tail fins, side engines, dorsal spines, and exposed reactor.
- Wing sockets for rival-theme pieces.

Required states:

- Entrance from rift with wing silhouette reveal.
- Idle hover with wing and tail motion.
- Attack telegraph through wing spread, mouth/core charge, and lock-on lines.
- Hit flash and armor break.
- Low-health exposed core.
- Death shatter with wing panels, spine fragments, reactor burst, and final screen pulse.

### Crawling Dragon Mech

Required anatomy:

- Low long body, armored head, segmented hull, claw legs, dorsal spines, tail, and underside glow.
- Leg/claw sockets for rival-theme pieces.

Required states:

- Entrance crawl from rift line or ground-plane tear.
- Idle crawl compression.
- Attack telegraph through head lowering, claw glow, and spine charge.
- Hit flash and segment cracks.
- Low-health broken plates.
- Death shatter into segments, claw shards, core burst, and lingering rift residue.

### Humanoid Dragon Mech

Required anatomy:

- Giant humanoid frame with horn crown, dragon chest reactor, heavy arms, legs, shoulder armor, wing or tail hints.
- Arm, chest, shoulder, and horn sockets for rival-theme pieces.

Required states:

- Entrance drop or reactor materialization.
- Idle stance with chest breathing pulse and arm motion.
- Attack telegraph through arm raise, chest core, and horn crown.
- Hit flash and shoulder/torso damage.
- Low-health exposed reactor.
- Death shatter into arms, chest plate, horn crown, and reactor shockwave.

Boss acceptance:

- Each Boss silhouette is identifiable without reading its name.
- Double-Boss encounters keep both Bosses distinct through silhouette, scale offsets, rival theme, and separate threat marks.
- Boss VFX must feel more intense than player VFX, while player silhouette and HUD remain readable.
- State-specific Boss body parts must be authored inside focused Boss sprite modules: entrance panels, telegraph weapons, low-health exposed cores, and death-shatter plates cannot be implemented only as generic rings.
- Boss QA must include a Boss-detail screenshot where warning, active telegraph, low-health, double-Boss, and victory death-shatter states are inspectable at meaningful scale.

Current evidence:

- `artifacts/visual-polish/qa-boss-scene.png` now includes warning entrance, active telegraph, low-health shatter-ready, double-Boss mixed silhouettes, and victory/death-shatter panels.
- `artifacts/visual-polish/qa-boss-action-pose-scene.png` isolates all three Boss silhouettes at inspection scale across entrance, peak attack, and low-health states, making wing spread, crawler lunge, claw strikes, arm cannons, and exposed-core pose pieces visible without depending on full-combat camera framing.
- The v20 Boss victory pass adds visual-only death-shatter clusters with core bursts, shock spokes, rival-theme residue rings, large armor plate fragments, and separate double-Boss shatter positions.
- The v31 Boss armor-detail pass adds a persistent high-density dragon-mech foreground layer across all three silhouettes: wing micro-panels and vents for Flying, tread plates and claw sockets for Crawling, crown spikes and arm rail sockets for Humanoid, plus energy seams, dragon-scale plates, charged sockets, exposed reactors, and fracture sparks.

Remaining gap:

- Bosses still need stronger entrance staging before active combat, live active attack animation clips, mobile Boss readability evidence, and better full-combat camera evidence where the new pose and armor-detail pieces remain legible under real player/projectile pressure.

## Summon Asset Packages

Only player-following persistent summons are allowed in the first version. No mines, turrets, traps, or placed persistent hazards.

Required variants:

- Orbiter crystal or satellite.
- Wingman drone.
- Dragon-like micro mech follower.

Required animation:

- Orbit or follow path.
- Thruster pulse.
- Attack flash from the summon body.
- Recall or respawn pop.
- Theme trail that does not imply a separate hazard.

Acceptance:

- Summon firing must visibly originate from the follower, not only from target-centered hit feedback.
- Summon body variants must share theme vocabulary with player attachments and Wishcraft effects.

## Wishcraft Skill Effect Asset Packages

Wishcraft effects are the most important visual reward in the game. They must make the player's typed wish feel manifested, even when the underlying mechanics are built from legal reusable pieces. A Wishcraft effect is not accepted if it is only a stat change, a palette swap, or a one-frame impact ring.

Every Wishcraft skill effect needs these independent layers:

- **Emitter:** charge, anticipation, socket glow, muzzle/sigil/source flash.
- **Body:** projectile, beam, blade, ring, follower shot, shield ripple, pickup path, or trigger marker.
- **Pattern:** large evolved-weapon geometry such as fan lanes, spiral paths, ricochet nodes, missile arcs, beam prisms, nova rings, summon links, or trigger sigils.
- **Travel:** trail, afterimage, corkscrew fragments, bounce path, exhaust, orbit marks, scanlines.
- **Contact:** impact core, slash contact, explosion, pierce cap, shield ripple, pickup burst.
- **Residue:** short-lived pixels, smoke, frost mist, gravity lens, music staff line, gear shard, neon scan, or other theme residue.
- **Screen accent:** optional thin pulse, radial wave, arena tint nudge, or edge flash for high-intensity families.

### Mechanic Family Inventory

| Family | Required body silhouette | Required VFX assets | Acceptance focus |
| --- | --- | --- | --- |
| Projectile Lance | Long spear bolt with bright head and darker shaft. | Emitter flash, pointed body, tail fragments, tip spark, pierce residue. | Reads as a direct shot, not a generic line. |
| Scatter Volley | Multiple smaller pellets in a fan. | Multi-muzzle flash, pellet sprites, short trails, staggered contact sparks. | Fan spacing and pellet bodies are readable under horde density. |
| Pierce / Beam | Thick linear beam with core, shell, and caps. | Charge cap, beam body, edge pixels, start/end caps, pierced-line residue. | Beam path is visible from source to target. |
| Spiral Rounds | Corkscrew or radial projectile pattern. | Rotating emitter ring, orbiting bodies, spiral trail fragments, radial contacts. | Spiral identity remains visible in a still frame. |
| Ricochet Track | Angular path with bounce nodes. | First shot, zigzag trail, bounce node sprite, secondary sparks. | Bounce nodes are visible and distinct from scatter pellets. |
| Micro Missile | Missile body with exhaust and payload. | Missile sprite, exhaust plume, contrail, explosion core, secondary sparks. | In-flight projectile reads as a missile before impact. |
| Melee Arc / Whirl / Lance / Saw | Blade arc, circular saw halo, or thrust spear near mech. | Windup, blade core, afterimage, contact spark, slash residue. | Melee effects stay near the mech and do not imply range changes. |
| Ring / Cone / Nova | Large area shape. | Source pulse, expanding edge, inner particles, target hits, fade residue. | Area family shape is clear without labels. |
| Summon Fire | Follower body firing a shot. | Summon socket flash, small projectile, trail, hit marker, recall pop. | Origin is the summon, not the player center. |
| Shield | Persistent shell and side-specific ripple. | Shield shell, hit ripple, recharge glints, orbit guards, pulse burst. | Shield visuals are defensive and do not look like damage-over-time. |
| Stat Support | Passive amplification. | Core glow, cadence sparks, muzzle accents, aura ticks, tuning lines. | Passive craft still feels awarded visually. |
| Pickup Magnet | XP attraction and shard light. | Curved magnet trails, shard streaks, pickup burst, optional split spark. | Magnet paths are visible but do not look like damaging hazards. |
| Trigger | Event marker followed by burst. | Source sigil, delayed pulse, event spark, explosion, residue. | Trigger is visually distinct from ordinary area burst. |
| Forward / Radial / Retaliation Burst | Patterned multi-shot burst. | Pattern telegraph, projectile bodies, multiple trails, synchronized impacts. | Directional geometry is clear in motion and stills. |

### Theme Motif Inventory

Each of the 24 catalog themes needs more than a palette. A theme kit should define attachment motif, projectile motif, trail particle, impact debris, residue, enemy drift motif, and Boss rival motif.

Priority themes for first polished skill pass:

- Starfire: star spears, ember pixels, flare nova.
- Frost: icicle bodies, mist trails, crack residues.
- Gravity: lens orbs, curved arcs, inward debris.
- Plasma: segmented ion beams, ribbons, vapor clouds.
- Crystal: prism shards, refracted glints, shatter bursts.
- Dragon: scale lances, fang slashes, breath bursts.
- Music: note bolts, waveform beams, staff-line residue.
- Clockwork: gear saws, cog bullets, timing rings.
- Neon: pixel lasers, scanlines, glitch squares.
- Meteor: molten rocks, smoke trails, crater bursts.
- Shield: hex disks, guard rings, broken barrier residue.
- Swarm: drone darts, hive motes, wing fragments.

Remaining themes still require structured motif kits:

- Void, storm, solar, lunar, magnetic, quantum, blade, angel, demon, ocean, forest, thunder.

Theme acceptance:

- A screenshot with several Wishcrafts should distinguish at least five mechanics and at least twelve themes without reading UI text.
- Large pattern VFX must render in a dedicated foreground skill layer when they are core reward visuals; background pulses alone are not enough.
- All 24 catalog themes need distinct pattern-kit signatures so same-mechanic wishes can still look visually fresh across themes.
- Theme QA should include a contact sheet or equivalent evidence that every theme renders without white panels, missing canvases, or palette-only differentiation.
- Theme motifs must be reused across player attachments, projectile effects, enemy drift, and Boss rival visuals.
- Theme residue must be short-lived unless a legal mechanic explicitly creates a persistent follower or projectile.

Current cinematic evidence:

- `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png` isolates twelve high-spectacle skill families across twelve themes: beam, lance, scatter, spiral, ricochet, missile, area nova, melee blade, summon salvo, shield prism, pickup vortex, and trigger rupture.
- `artifacts/visual-polish/qa-live-combat-spectacle-scene.png` captures those reward effects in a real late-run desktop combat renderer with double Bosses, 140+ enemies, 46 XP shards, four summons, and fourteen Wishcraft-hit events spanning twelve visual families.
- `artifacts/visual-polish/qa-mobile-spectacle-scene.png` captures the same late-run reward stack in portrait with two Bosses, 100+ enemies, four summons, XP shards, twelve Wishcraft themes, and twelve-plus Wishcraft-hit events.
- `artifacts/visual-polish/qa-mobile-combat-scene.png` verifies live portrait readability with seven simultaneous Wishcraft themes, dense horde pressure, Boss HUD, player HUD, and joystick present.
- The v19 cinematic pass adds a dedicated visual-only animation layer for mid-frame reward impact: afterimages, bright cores, rings, radial shock spokes, square rupture frames, missile blooms, and theme glyphs.
- The v27 evolved-weapon pass adds a separate `visual/wishcraft/evolved/` domain for large reward forms, making spiral, ricochet, shield, and pickup wishes inspectable as distinct silhouettes instead of only palette or impact-ring variants.
- The v30 evolved ornament pass adds a dedicated foreground decoration layer for all evolved patterns: halo bands, directional ribs, orbit pearls, contrail shards, corkscrew dust, theme glyphs, foreground shards, and star sparks. This makes the Wishcraft contact sheet read closer to a super-weapon reward instead of a sparse impact diagram.

Remaining gap:

- Cinematic VFX still need short clips proving launch, travel, impact, and fade in motion.
- More live horde and mobile screenshots are still required across fresh run, first Wishcraft, and active Boss states before the cinematic layer can be called complete; v32 adds the first wide late-run density frame and v34 adds portrait late-run density, but neither supplies motion proof.
- Shield side-hit, summon-origin projectile bodies, and XP pickup trails tied to actual shard paths still need deeper runtime passes.
- Evolved-weapon contact-sheet evidence is richer after v30, but still does not prove live gameplay readability under real late-run projectile saturation; that still needs desktop and mobile combat screenshots or clips after the next runtime pass.

## Arena Asset Packages

Required phases:

- Deep Starfield.
- Nebula Rift.
- Ion Graveyard.
- Singularity Gate.

Required VFX:

- Parallax-feeling star densities.
- Dim large nebula or field masses.
- Tech grid or distant orbital arcs.
- Phase-specific landmarks.
- Double-Boss transition pulse.
- Wishcraft tint overlay constrained by readability budget.

Acceptance:

- Arena background changes after each double-Boss milestone.
- Arena phase changes stay visual-only.
- The player, nearest enemies, Boss health bar, XP bar, and mobile joystick remain readable.

## UI Visual Requirements

Combat UI is utilitarian and must not become a decorative landing page.

Required UI:

- Top XP bar.
- Level above player as `Lv.xxx`.
- Health below player.
- Boss name and health bar during active Boss encounters.
- Wish Break modal with manifestation/loading state.
- Home screen with start, leaderboard, and language switch only before game start.

No debug UI should be added.

## QA Evidence Matrix

Before claiming a visual package is complete, capture these as relevant:

- Desktop fresh-run horde.
- Desktop first Wishcraft.
- Desktop 3+ Wishcraft loadout.
- Desktop Boss warning.
- Desktop active Boss.
- Desktop double-Boss.
- Desktop late-run projectile saturation.
- Mobile portrait fresh run.
- Mobile portrait first Wishcraft.
- Mobile portrait Boss.
- Mobile portrait late-density combat.

Current evidence:

- `artifacts/visual-polish/qa-combat-scene.png`: desktop late-run projectile saturation, horde pressure, and multi-Wishcraft loadout.
- `artifacts/visual-polish/qa-base-kit-weapon-scene.png`: base machine-gun and laser-sword six-frame contact sheet with socket-origin reference points.
- `artifacts/visual-polish/qa-common-enemy-hit-scene.png`: family-specific common-enemy hit-frame contact sheet.
- `artifacts/visual-polish/qa-player-mech-scene.png`: player mech inspection states, including dense loadout and portrait crop.
- `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png`: isolated Wishcraft spectacle contact sheet.
- `artifacts/visual-polish/qa-boss-scene.png`: Boss warning, active telegraph, low-health, double-Boss, and victory shatter panels.
- `artifacts/visual-polish/qa-boss-action-pose-scene.png`: inspection-scale Boss action-pose contact sheet for flying, crawling, and humanoid silhouettes across entrance, peak attack, and low-health states.
- `artifacts/visual-polish/qa-mobile-combat-scene.png`: mobile portrait late-density combat with HUD, Boss pressure, joystick, horde, XP, summons, shield, and seven Wishcraft themes.
- `artifacts/visual-polish/qa-mobile-spectacle-scene.png`: mobile portrait late-run spectacle with two Bosses, 100+ enemies, XP shards, summons, twelve Wishcraft themes, player readability field, top HUD, Boss HUD, and bottom-center joystick.

Acceptance checks:

- Player silhouette readable.
- Three common enemy families readable.
- At least five attack families distinguishable.
- Boss silhouette readable without name.
- Wishcraft theme visible on player, skill effect, and recent enemy drift.
- Effects do not hide the player health bar, level label, XP bar, Boss bar, or joystick.

## Production Backlog Order

1. Common enemy authored frame pass: 4-frame body art, hit frame, family death fragments, stronger drift sockets.
2. Wishcraft mechanic-family VFX pass: stronger silhouette grammar for scatter, ricochet, missile, spiral, trigger, summon fire, shield, pickup, and burst.
3. Player mech attachment polish: denser base anatomy, direction-aware thruster frames, install snap-on.
4. Boss state pass: entrance, anatomy-tied telegraphs, damage states, death shatter for all three silhouettes.
5. Theme motif expansion: fill all 24 themes beyond palette shifts.
6. Arena phase landmark pass: authored phase backgrounds and double-Boss transitions.
7. Mobile polish pass: broaden portrait evidence to fresh run, first Wishcraft, active Boss, and motion clips after the next animation passes.
