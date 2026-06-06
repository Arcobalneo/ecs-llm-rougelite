# Visual Production Plan

This document is the working production checklist for raising Infinite Starwish from programmer-art geometry to a polished Neon Pixel Space survivor-like. The Vampire Survivors images in `docs/visual-reference/vampire-survivors/` define the commercial polish bar for density, readability, projectile saturation, and late-run energy. They do not define theme, palette, sprite content, or allowed runtime assets.

The current visual target is code-drawn pixel art with shader-like particles: no AIGC runtime assets, no imported sprite sheets, and no copied reference pixels. Every asset below should be generated from reusable drawing primitives, procedural pixel templates, Pixi layers, or shaders.

Use `docs/visual-asset-requirements.md` as the source-of-truth asset checklist. This file remains the implementation pass log and high-level production plan.

## Quality Bar

1. **Readable silhouettes before effects.** A screenshot should still identify the player, each common enemy family, and the boss body plan when effects are disabled or visually busy.
2. **Sprite-like construction, not icon geometry.** Characters need heads, torsos, limbs, armor plates, asymmetry, damage-facing edges, highlights, and shadow pixels. A circle/square with glow is a placeholder, not an accepted asset.
3. **Wishcraft fantasy visible in three places.** Each awarded Wishcraft must show on the player mech, in attack animation/VFX, and in recent enemy drift. Bosses show rival-theme visual assembly from the same vocabulary.
4. **Horde density with foreground separation.** Common enemies can be small, but they need distinct families and animation frames. They must not blur into identical colored tokens.
5. **Animation sells the asset.** Idle bob, thrusters, melee arcs, projectile launch, impact, death burst, XP attraction, summon orbit, and boss telegraph are required animation categories.
6. **Effects are layered.** Strong VFX need core shape, glow shell, particles, trail, and impact residue. A one-frame ring does not meet the bar.
7. **Wishcraft skill spectacle is core gameplay.** A Wishcraft should feel like the player got the power they typed, not just a stat increase. Skill effects need strong silhouettes, theme-specific particles, launch animation, travel animation, hit animation, and late-run screen energy.
8. **Mobile readability is first-class.** Player and joystick remain readable in portrait. Effects may compress density, not hide the player.

## Entity Asset Inventory

### Player Mech

Required base asset:

- Humanoid mech front-facing combat silhouette.
- Helmet/visor with two readable eye or sensor highlights.
- Chest core with a bright but non-obscuring energy aperture.
- Shoulder armor, forearms, hands or weapon mounts, hips, knees, boots.
- Back thruster pack visible behind torso.
- Dark outer pixel outline separating the mech from bright effects.
- Three-value material language: dark shell, mid armor, bright neon emissive.

Required animation states:

- Idle hover: 4-6 frame bob, with alternating shoulder/leg subpixel motion.
- Movement thrust: rear/bottom exhaust extends opposite movement vector.
- Auto machine-gun: muzzle flash at ranged weapon mount with projectile trail.
- Auto laser sword: short sweeping blade arc near the mech, not a generic impact ring.
- Hit feedback: shield/armor flicker without hiding silhouette.
- Level-up/Wishcraft install: part snaps onto the mech, not just an overlay ring.

Current gap:

- Base silhouette now has denser frame art after the `hd2d-cyberpixel-v18` pass: armor breakup, asymmetric sockets, backpack vents, visible silhouette cut-ins, limb pose armor, and stronger thruster read.
- Movement direction affects thrust intensity, leg pose, and frame-art offsets as visual-only animation.
- Base machine-gun and laser sword now have a first authored multi-stage VFX pass after `hd2d-cyberpixel-v22`: muzzle/hilt charge, active tracer/blade, and fade residue frames. The `hd2d-cyberpixel-v23` pass shifts those frames from player-center feedback origins to visible forearm-rail and sword-hilt sockets.
- Wishcraft install is still represented by persistent attachments and effects, not a snap-on animation sequence.

### Common Enemies

First-version families:

- **Fast Fragile**: small dart/harrier drone with pointed nose, side fins, exposed core.
- **Slow Tough**: chunky shielded crawler/blocker with thick armor and side plates.
- **Swarm Fragile**: tiny bug/drone cluster with separated wing/limb pixels.

Required per-family asset details:

- 3-4 frame locomotion/hover cycle.
- Dark pixel outline plus family-specific shape language.
- Hit flash frame.
- Death breakup into 4-8 theme-tinted fragments.
- Enemy Drift sockets for 1-3 recent Wishcraft visual pieces.
- Size discipline: common enemies stay small enough for horde combat, but not abstract tokens.

Current gap:

- Families now have different silhouettes and layered pixel bodies after the `hd2d-cyberpixel-v3` pass.
- They now have authored visual locomotion overlays after the `hd2d-cyberpixel-v29` pass: dart trails for Fast Fragile, crawler scrape/tread motion for Slow Tough, and micro-node flutter for Swarm Fragile.
- Death is now family-specific after the enemy death pass, and short-lived hit feedback has first family-specific VFX after `hd2d-cyberpixel-v24`.
- Living body hit-pose redraws are authored into the enemy sprite after the `hd2d-cyberpixel-v26` pass.

### Bosses

Required silhouettes:

- **Flying Dragon Mech**: wings, horned head, long body/keel, tail fins, engine vents.
- **Crawling Dragon Mech**: long armored body, low head, legs/claws, dorsal spines.
- **Humanoid Dragon Mech**: giant humanoid frame with horn crown, heavy arms, legs, chest reactor.

Required boss features:

- Boss scale must exceed player scale and visual-piece density.
- Rival theme palette and attachments must be obvious.
- Local-template boss name and top health bar remain readable.
- Idle animation, entrance pulse, attack/pressure telegraph, hit flash, death shatter.
- Double-boss encounter must keep both bosses distinct.

Current gap:

- Silhouette classes exist and have stronger dragon-mech body plans after the `hd2d-cyberpixel-v3` pass.
- Bosses now have authored attack pose assets and state body parts after the action-pose and state-body passes.
- Bosses now have a persistent armor-detail foreground layer after the `hd2d-cyberpixel-v31` pass, with deeper integration into wings, claws, reactors, horns, tread plates, and weapons.
- Bright rival themes such as Frost can still flatten at Boss scale unless palette roles and inner shadows are tuned per silhouette.

### Summons

Allowed persistent combat entity:

- Player-following orbiter/wingman/satellite only.

Required variants:

- Orbiter crystal/satellite.
- Wingman drone.
- Dragon/animal-like micro mech only as a follower silhouette, not a separate placed turret.

Required animation:

- Orbit path, thruster pulse, attack flash, recall/respawn pop.
- Theme-colored trail that does not become a gameplay hazard.

Current gap:

- Summons have stronger shape than before, but not enough variant identity.
- Attack flash is implied through hit feedback, not launched from summon.

## Wishcraft Visual Piece Inventory

Each `AttachmentSlot` needs a sprite-quality kit. A kit is not one shape; it is a family of compatible drawing functions selected by theme and role.

- `core`: chest reactors, abdomen cores, boss heart modules.
- `head`: helmets, crests, horns, halos, antennae.
- `shoulder`: pauldrons, missile pods, shield guards.
- `arm`: gauntlets, claws, railgun braces.
- `back`: wings, thruster rigs, reactor spines.
- `hip`: side pods, ammo packs, hanging modules.
- `weapon`: swords, guns, lances, emitters.
- `aura`: rings, sigils, heat shimmer, gravitational lens rings.
- `orbit`: orbit tracks plus orbiting modules.
- `trail`: exhaust, afterimages, ribbon trails.
- `projectile`: in-flight projectile bodies and trails.
- `impact`: hit sparks, explosions, slash residues.
- `summon`: follower body shells.

For each theme tag, visual pieces should define:

- Primary material motif.
- Particle motif.
- Projectile silhouette.
- Impact silhouette.
- Player attachment motif.
- Enemy drift motif.
- Boss rival motif.

Current gap:

- Catalog richness exists as data, but many themes resolve to the same few drawing primitives.
- Visual pieces do not yet pick theme-specific motifs beyond palette.

## Wishcraft Skill VFX Asset Inventory

Wishcraft skill effects are a top-level production pillar. They are the main reward for typing a wish, and they must deliver the same kind of spectacle that Vampire Survivors gets from evolved weapons, while staying in Infinite Starwish's code-drawn cyberpixel space-mech style.

Every Wishcraft skill effect must be assembled from five independent layers:

1. **Mechanic silhouette.** The primary mechanic chooses the motion grammar: lance, scatter, beam, spiral, ricochet, missile, melee sweep, nova, orbit, shield, pickup magnet, or trigger burst.
2. **Theme material.** The primary theme chooses the material language: flame, frost, gravity lens, crystal prism, dragon scale, music wave, clockwork gear, neon pixel, and so on.
3. **Emitter socket.** The visual pieces on the mech choose where the effect starts: shoulder pod, arm weapon, back rig, core aperture, aura ring, orbit module, summon follower, or screen-space trigger marker.
4. **Intensity tier.** Later-level and visually dense Wishcrafts need stronger effects: larger anticipation flash, extra projectile lanes, thicker trails, secondary sparks, stronger impact residue, and screen pulse.
5. **Readability budget.** The effect can be loud, but its core path and hit target must remain readable under horde density and on mobile portrait.

### Universal Skill Effect Layers

Each active skill family needs these reusable asset pieces:

- **Charge / anticipation:** 2-6 frame glow buildup at the emitter, including pixel core, outer glow, and small directional particles.
- **Launch frame:** muzzle flash, sword start arc, aura pulse, summon firing flash, or trigger sigil.
- **In-flight body:** the readable projectile or beam silhouette. This is the part that tells the player what the skill is doing.
- **Trail / afterimage:** ribbon, segmented pixels, spiral particles, exhaust, lens distortion rings, or echo copies.
- **Impact core:** first hit spark, slash contact, explosion center, pierce contact, bounce node, or shield ripple.
- **Impact debris:** 4-16 small fragments or particles that match the theme material.
- **Residue:** short-lived burn mark, frost mist, gravity ring, music staff line, gear shard, plasma haze, or neon scanline. Residue is visual only and must not imply a lingering gameplay hazard unless the mechanic actually has one.
- **Screen accent:** optional thin full-screen pulse, chromatic edge, arena tint nudge, or radial wave for high-intensity Wishcrafts.

### Mechanic Family Requirements

| Mechanic family | Required readable silhouette | Required animation / VFX assets | Current gap |
| --- | --- | --- | --- |
| Projectile Lance | One long pointed bolt or spear with a bright head and darker shaft. | Emitter flash, lance body, straight trail, tip spark, piercing residue. | Current effect is mostly a line plus impact. Needs a distinct bolt body and themed head/tail. |
| Scatter Volley | Several smaller pellets with fan spacing and staggered impacts. | Multi-muzzle flash, pellet sprites, short trails, separated contact sparks. | Current fan lines are readable but too generic; pellet bodies need theme shapes. |
| Pierce / Ray / Beam | Thick linear beam with bright core, translucent shell, and start/end caps. | Charge frame, beam body, edge pixels, impact caps, light residue along pierced enemies. | Needs persistent beam body and stronger start emitter, not only target-centered feedback. |
| Spiral Rounds | Curving or radial projectiles with corkscrew trail. | Rotating emitter ring, orbiting projectile bodies, spiral trail fragments, radial contacts. | Spiral currently collapses into radial hits; needs a specific motion and trail vocabulary. |
| Ricochet Track | Angular path with bounce nodes. | First shot, zigzag trail, bounce flash markers, second-hit sparks. | Has angular line but lacks bounce node sprite and secondary fragments. |
| Micro Missile | Missile body, exhaust plume, and explosive payload. | Missile sprite, engine trail, arcing contrail, explosion core, secondary sparks. | Current impact reads like explosion but not enough in-flight missile identity. |
| Melee Arc / Whirl / Lance / Saw | Directional blade, circular saw halo, or thrusting spear arc near the mech. | Weapon windup, blade core, afterimage, contact spark, close-range slash residue. | Base sword exists; Wishcraft melee needs theme-specific blades and different silhouettes per subfamily. |
| Ring / Cone / Nova Burst | Large area shape: ring, wedge, or layered nova. | Source pulse, expanding edge, inner particles, target hits, fade residue. | Area effects are readable but need authored ring/cone/nova identities and better screen-space energy. |
| Summon Orbiter / Drone / Wingman / Satellite | Follower entity plus its own firing effect. | Summon body, orbit path, thruster, fire flash, projectile trail, recall pop. | Summon body exists; attack effects are still implied by hit feedback instead of visibly emitted from follower. |
| Shield Capacity / Pulse / Orbit | Persistent shell, shield hit ripple, and optional orbiting guard marks. | Shield layer, shield recharge glints, side-specific ripple, pulse burst, orbit marker. | Shield feedback exists; persistent shield shell and side impact are not strong enough. |
| Stat Support | Passive visual amplification without pretending to be a separate attack. | Muzzle cadence accent, core glow, speed streaks, damage tuning sparks, aura tick. | Needs passive visual read so a stat Wishcraft still feels awarded. |
| Pickup Magnet / Splinter | XP attraction paths and shard splitting light. | Curved magnet trails, shard streaks, pickup burst, optional small outgoing splinters. | XP shards rotate and collect; magnet curves need richer trail art. |
| Trigger On Kill / Pickup / Low Shield | Event marker at source followed by burst. | Source sigil, delayed pulse, event-specific spark, explosion, residue. | Trigger visuals are too close to generic area burst. |
| Forward / Radial / Retaliation Burst | Burst direction pattern: frontal fan, full radial, or player-hit counterblast. | Pattern telegraph, projectile bodies, multiple trails, synchronized impacts. | Needs clear pattern geometry and stronger projectile bodies. |

### Theme-Specific Skill Motifs

Every theme needs at least one distinct motif for projectile body, trail particles, impact debris, and residue. Palette changes alone are not enough.

| Theme | Projectile / beam motif | Trail / particle motif | Impact / residue motif |
| --- | --- | --- | --- |
| Starfire | Star spear, flare bullet, comet shard | Ember pixels, star sparks, heat shimmer | Small flare nova, burnt orange star fragments |
| Void | Negative-space bolt, rift slash, dark cube | Purple-black motes, collapsing rings | Rift tear, imploding ring, shadow residue |
| Gravity | Lens orb, compression beam, orbiting pebble | Curved orbit arcs, small satellites | Gravity well ring, inward-pulled debris |
| Plasma | Ion bolt, segmented beam, electric bead | Cyan plasma ribbon, magenta sparks | Ion splash, pixel vapor cloud |
| Crystal | Prism shard, refracted beam, gem lance | Faceted chips, rainbow glints | Shatter burst, prism residue |
| Storm | Wind blade, cyclone pellet, pressure wave | Spiraling streaks, white gust pixels | Cyclone pop, broken air rings |
| Frost | Icicle lance, snow beam, frost disk | Ice mist, snow grains, cold shards | Freeze crack, frost bloom residue |
| Solar | Sun dart, corona beam, flare ring | Gold rays, heat motes | Corona pulse, bright solar scorch |
| Lunar | Crescent blade, moon pearl, tide beam | Pale afterimages, tide curls | Crescent ripple, moon dust |
| Magnetic | Rail slug, magnetized shard, metal beam | Rail lines, polarized sparks | Metal snap, magnetic field ring |
| Quantum | Split-frame bolt, probability shard | Duplicate ghost pixels, blink squares | Phase pop, checker residue |
| Dragon | Scale lance, fire fang, claw slash | Ember scales, smoke pixels | Dragon-breath burst, scale fragments |
| Music | Note bolts, waveform beam, staff-line slash | Equalizer pixels, rhythm rings | Chord burst, wave residue |
| Blade | Sword beam, razor shard, saw tooth | Slash afterimages, silver sparks | Cross-cut flash, blade chips |
| Shield | Barrier disk, guard bolt, shield rim | Hex pixels, green-white pulses | Shield ripple, broken hex residue |
| Swarm | Drone dart, hive pellet, stinger bolt | Micro drones, lime motes | Hive pop, tiny wing fragments |
| Angel | Feather lance, halo beam, wing slash | Feather pixels, soft light motes | Halo burst, white-gold feather residue |
| Demon | Crimson fang, cursed bolt, claw beam | Red embers, black sparks | Blood-red burst, thorn residue |
| Clockwork | Gear saw, cog bullet, timing beam | Gear teeth, ticking sparks | Gear shatter, clock-ring residue |
| Ocean | Wave bolt, tide beam, bubble dart | Bubbles, water streaks, foam pixels | Splash ring, mist residue |
| Forest | Thorn lance, seed bullet, vine beam | Leaves, spores, vine curls | Thorn pop, pollen cloud |
| Thunder | Lightning fork, volt bead, rail arc | Branching arcs, white flashes | Electric fork burst, charged residue |
| Neon | Pixel laser, scanline dart, cyber shard | RGB pixels, scanlines, glitch squares | Glitch pop, neon scan residue |
| Meteor | Rock comet, falling shard, molten slug | Smoke trail, orange fragments | Crater burst, molten debris |

### Skill Intensity Tiers

Wishcraft has no fixed authored upgrade tree in the first version, so spectacle scaling should come from visual budget, player level, and loadout density.

- **Tier 1: Fresh craft.** One emitter, one readable projectile/area shape, short trail, compact impact.
- **Tier 2: Mid-run craft.** Extra launch particles, secondary trail layer, stronger impact debris, small screen pulse.
- **Tier 3: Late-run craft.** Multiple lanes or thicker beam, orbiting sub-particles, stronger residue, visible arena tint pulse.
- **Tier 4: Super-weapon feel.** Reserved for high-level/high-budget Wishcrafts: full layered launch, projectile body plus shell, long trail, large themed impact, short screen wave, and enemy death fragments tinted by the same theme.

Tier 4 is a visual spectacle tier, not a separate RPG status system. It must not add hidden mechanics beyond the legal mechanic pieces.

### Wishcraft Skill VFX Acceptance

Before a Wishcraft VFX pass is accepted:

- A still screenshot should distinguish at least five active attack families without reading code or labels.
- A short clip should show launch, travel, impact, and fade for projectile, melee, area, summon, shield, pickup, and trigger families.
- At least twelve themes should have visible motif differences beyond palette in the first polished pass, with the catalog structured so all twenty-four themes can be filled.
- Player attachments, projectile effects, and enemy drift must share theme motifs without sharing gameplay behavior.
- Skill effects must be spectacular enough to feel like the reward for a typed wish, but they must not hide the player's mech, health bar, or joystick.
- Mobile portrait screenshots must still make the main projectile direction and nearest enemy contacts readable.

## Base Attack And VFX Inventory

Base kit:

- Machine-gun tracer: launch flash, segmented plasma bullet, muzzle ejection pixels, target spark, and fade residue.
- Laser sword: hilt charge, windup sweep, active blade core, afterimage fan, close contact shards, and fade residue.

Wishcraft projectile families:

- Lance: long spear bolt with pointed core, trailing fragments.
- Scatter: several small pellets fanning out with staggered impacts.
- Pierce/Beam: thick beam segment with bright core and transparent outer shell.
- Spiral: radial or spiral projectiles leaving corkscrew trails.
- Ricochet: angular bounce path and target-to-target segments.
- Missile: body, exhaust, explosion, secondary sparks.
- Burst Front/Radial: repeated projectiles with clear origin.

Area and trigger:

- Ring burst: expanding ring plus pixel debris.
- Cone burst: wedge shape plus forward sparks.
- Nova burst: layered circular shockwave.
- On-kill/on-pickup/low-shield trigger: source marker then explosion.

Shield and pickup:

- Shield capacity: persistent shield shell around player.
- Shield hit: ripple at impact side.
- XP magnet: XP shards curve toward player with streak trail.

Current gap:

- Feedback now lasts for multiple frames and uses Wishcraft theme colors.
- The `hd2d-cyberpixel-v4` pass adds a dedicated short-lived projectile VFX render pool, themed projectile bodies, impact debris, and residue.
- The `hd2d-cyberpixel-v22` pass adds dedicated base-kit weapon animation modules for machine-gun and laser-sword windup/active/fade frames.
- Many effects still need richer emitter-socket launches and longer-lived trail pools before they read like fully authored evolved-weapon patterns.
- Multiple simultaneous Wishcraft hits can still cluster around the player instead of reading like separate evolved-weapon patterns.
- Projectile VFX is visually decoupled from mechanics, but not yet deep enough to express every mechanic family with unique motion grammar.

## Current Visual Pass Notes

### `hd2d-cyberpixel-v3`

Screenshots captured under `artifacts/visual-polish/`:

- `arena-v3-fresh-final.png`
- `arena-v3-wishcraft-vfx-final.png`
- `arena-v3-boss-active-final.png`

Completed in this pass:

- Added the first detailed visual production checklist for player, enemies, Bosses, summons, Wishcraft visual pieces, Wishcraft skill VFX, arena, UI, and acceptance.
- Expanded Wishcraft skill VFX requirements into a standalone asset inventory with mechanic-family silhouettes, theme motifs, intensity tiers, and acceptance criteria.
- Improved common enemies from simple shapes into layered code-drawn pixel units with stronger family silhouettes, armor plates, fins/wings/legs, sensors, joints, and thrusters.
- Improved Boss base silhouettes into more distinct flying dragon, crawling dragon, and humanoid dragon mech bodies.
- Added reusable pixel drawing primitives for armor panels, joints, outlined segments, sensor pairs, micro debris, theme residue, gear shards, and star sparks.
- Added first-pass themed Wishcraft trajectory details, impact debris, and residue so skill feedback is no longer only a colored impact marker.
- Reduced screen-level aura dominance around the player so character silhouettes remain easier to inspect.

QA result:

- Fresh-run horde readability is materially better: the three common enemy families are distinguishable in a still screenshot.
- Player silhouette remains readable in fresh-run and Boss screenshots.
- Boss silhouette is larger and more readable, but still needs frame animation, richer inner anatomy, better palette role tuning, and attack/death VFX before it meets the commercial-art target.
- Wishcraft skill VFX has the start of theme-specific spectacle, but it is not yet at the intended evolved-weapon bar. The next pass needs persistent projectile/trail entities and clearer per-mechanic screen patterns.

Next visual polish priorities:

1. Extend the projectile/trail render pool so lance, beam, scatter, missile, ricochet, spiral, and burst attacks have emitter-socket launches, richer travel bodies, and longer trail residue.
2. Add 3-4 frame animation variants for each common enemy family, including locomotion, hit flash, and family-specific death breakup.
3. Build Boss entrance, idle, hit, attack telegraph, and death-shatter assets for each silhouette.
4. Move Wishcraft visual motifs from mostly palette-driven drawing into theme-specific shape kits.
5. Capture mobile portrait screenshots for fresh run and first Wishcraft after the next projectile/trail pass.

### `hd2d-cyberpixel-v4`

Completed in this pass:

- Split the visual runtime into dedicated modules instead of continuing to grow `src/client/arena.ts`:
  - `visual/pixel-primitives.ts`: reusable code-drawn pixel primitives and tiny motif helpers.
  - `visual/arena-horizon.ts`: arena background and phase atmosphere.
  - `visual/combat-entity-sprites.ts`: player, common enemy, summon, and Boss sprite factories.
  - `visual/runtime-attachments.ts`: shared Wishcraft visual-piece attachments and screen effects.
  - `visual/combat-feedback-vfx.ts`: base hits, Wishcraft impacts, shield, summon, XP, and death feedback.
  - `visual/wishcraft-projectile-vfx.ts`: short-lived projectile/beam flight bodies and lifetime updates.
  - `visual/wishcraft-vfx-palette.ts`: Wishcraft theme-to-VFX color mapping.
- Added origin data to base attack and Wishcraft hit feedback so projectile and beam visuals can travel from source to target.
- Added a separate projectile layer and render cache so in-flight Wishcraft visuals are not folded into target-centered impact effects.
- Added tests for theme-derived Wishcraft hit palettes, projectile VFX eligibility, and projectile lifetime progress.
- Preserved visual/mechanics decoupling: mechanics emit feedback facts; visual modules decide how to draw bodies, trails, impacts, and residue.

QA result:

- `src/client/arena.ts` is now primarily runtime orchestration, not a single pile of visual asset implementations.
- The game has a clearer production path for iterating entity sprites, attachments, projectile VFX, and combat feedback independently.
- The follow-up structure pass moved Pixi combat rendering into `src/client/rendering/combat-renderer.ts` and enemy spawn pressure into `src/client/simulation/enemy-spawning.ts`.
- The follow-up animation/VFX pass added `src/client/visual/combat-entity-animation.ts` for reusable animation state, split Boss sprites into `src/client/visual/boss-entity-sprites.ts`, added movement-aware player thrusters, 4-frame common enemy animation states, Boss telegraph animation, and full origin-to-target beam bodies.
- The follow-up emitter/trail pass added `src/client/visual/wishcraft-launch-vfx.ts` and `src/client/visual/wishcraft-trail-vfx.ts`, giving Wishcraft attacks source flashes and longer-lived trail residue in addition to projectile bodies and impact feedback. Enemy death feedback now uses denser mech shard breakup with theme-colored residue.
- The follow-up emitter-socket pass added `src/client/visual/runtime-attachment-layout.ts` and `src/client/visual/wishcraft-emitter-sockets.ts`, so projectile, area, melee, summon, shield, pickup, and trigger visual families can resolve a launch origin from the player's equipped visual pieces without changing gameplay hit logic.
- The feedback render pool moved from `src/client/rendering/combat-renderer.ts` into `src/client/rendering/feedback-renderer.ts`, keeping transient VFX lifetime management separate from Pixi stage/entity synchronization.
- The follow-up entity-detail pass added `src/client/visual/mech-detail-primitives.ts` for reusable mechanical seams, rivets, heat sinks, cable bundles, faceplates, weapon rails, wing struts, and dragon spines. Player, common enemy, and Boss sprites now use those helpers to add more dense sci-fi mechanical detail without changing simulation data.
- The follow-up Wishcraft motif pass added `src/client/visual/wishcraft-theme-motifs.ts`, mapping all 24 catalog themes into reusable VFX motif families. Projectile bodies, launch flashes, trail residue, and impact bursts now share theme-specific shapes instead of relying mostly on palette shifts.
- The follow-up particle-cloud pass added `src/client/visual/wishcraft-particle-cloud-vfx.ts` and a new feedback-renderer VFX pool. Wishcraft hits now spawn short-lived, budgeted, theme-motif particle clouds around projectile paths, area bursts, melee hits, triggers, and impacts to raise late-run screen energy without adding gameplay hazards or status effects.
- The follow-up screen-pulse pass added `src/client/visual/wishcraft-screen-pulse-vfx.ts` and a dedicated `screenPulseLayer` behind entities. High-impact Wishcraft families such as area, beam, burst, missile, and trigger now create large theme-motif rings, spokes, scanlines, and screen-energy pulses without covering DOM UI or changing gameplay rules.
- Full validation must be re-run after each structure or visual polish pass: `npm test -- --run`, `npm run typecheck`, and `npm run build`.

Engineering structure update:

- `src/client/rendering/combat-renderer.ts` owns Pixi stage boot, layer order, render caches, camera transform, and entity graphic synchronization.
- `src/client/rendering/feedback-renderer.ts` owns transient combat feedback pooling, launch VFX pooling, projectile VFX pooling, trail residue pooling, per-frame feedback budgets, and lifetime updates.
- `src/client/simulation/enemy-spawning.ts` owns initial horde density, spawn positions, common enemy template rotation, and post-Boss/time pressure scaling.
- `src/client/arena.ts` must stay an orchestration shell for player journey state, DOM UI, Wish Break, Boss scheduling, settlement, input, and high-level runtime ticking.
- New art work should enter through focused modules under `src/client/visual/` or `src/client/rendering/`; `arena.ts` should not receive sprite factories, Pixi layer implementation, particle drawing, or asset catalogs.

Remaining visual gaps:

- Entity sprites now have animation state and per-frame redraw hooks, but still need deeper authored frame art and death breakup variants.
- Wishcraft effects now have attachment-specific emitter socket selection, source flashes, stronger projectile/beam bodies, area/melee/trigger feedback, and trail residue, but still need denser late-run trail pooling, summon-origin firing, and theme-specific shape kits for every mechanic family.
- Bosses now have animated telegraph/aura/jaw/limb/wing states, but still need entrance staging and death-shatter assets.
- Mobile portrait screenshots still need to be captured after the next art pass.

### `hd2d-cyberpixel-v5`

Completed in this pass:

- Added `src/client/visual/late-run-field-vfx.ts` as a visual-only persistent battlefield energy layer. It draws budgeted orbit arcs, long geometric projectile-field lanes, and theme-motif particles from the recent Wishcraft loadout.
- Integrated the late-run field into `src/client/rendering/combat-renderer.ts` as a separate Pixi `Graphics` layer behind entities, keeping `combat-renderer` as layer orchestration rather than particle implementation.
- Added `tests/client/late-run-field-vfx.test.ts` so late-run field density scales with player level, Boss progress, and loadout richness while clamping lane and particle budgets.
- Updated the QA scene to stress late-run density with more common enemies, XP shards, and simultaneous Wishcraft attack families.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The late-run screenshot now has stronger screen energy: persistent field lines, orbital arcs, theme particles, multiple projectile families, denser XP, and heavier horde pressure.
- This is a meaningful improvement for projectile saturation and late-run chaos, but it does not close the main art gap yet.
- Common enemy assets still repeat too visibly and need stronger 4-frame authored animation, silhouette variants, family-specific hit/death breakup, and recent-Wishcraft drift pieces.
- Bosses still need entrance, attack, hit, and death assets with bigger dragon-mech anatomy changes, especially at double-Boss scale.
- Wishcraft skill VFX still needs richer mechanic-specific motion grammar for spiral, scatter, ricochet, missile, summon firing, shield, and trigger families before it reaches the evolved-weapon spectacle target.

Engineering structure note:

- New visual systems should continue to enter as focused modules under `src/client/visual/` with dedicated tests under `tests/client/`.
- `src/client/rendering/combat-renderer.ts` is close to the next split threshold; if more layer orchestration is added, extract Pixi boot/layer creation into `src/client/rendering/pixi-stage.ts` and entity map synchronization into `src/client/rendering/entity-sync.ts` before adding more feature logic.

### `hd2d-cyberpixel-v6`

Completed in this pass:

- Added template-aware common enemy death feedback. `enemy-death` feedback can now carry `templateId` and `radius` as visual hints without changing combat rules.
- Added `src/client/visual/enemy-death-vfx.ts` for three distinct common-enemy breakup treatments:
  - Fast Fragile breaks into wing panels and forward harrier shards.
  - Slow Tough breaks into heavier armor plates with longer-lived debris.
  - Swarm Fragile breaks into smaller multi-node drone fragments.
- Moved enemy death shard drawing out of `combat-feedback-vfx.ts`, keeping the generic feedback module from becoming a mixed-purpose art file.
- Added `tests/client/enemy-death-vfx.test.ts` and expanded combat-loop coverage so visual feedback keeps the defeated enemy template available.
- Updated the visual QA scene so static death bursts exercise all three enemy templates.

QA expectation:

- Horde kills should read more like mechanical units breaking apart, not identical generic spark rings.
- This improves the moment-to-moment survivor-like kill feedback, but the next major gap is still the living enemy sprites themselves: they need more authored frame variants, silhouette variation inside each family, and stronger recent-Wishcraft drift integration.

### `hd2d-cyberpixel-v7`

Completed in this pass:

- Added `src/client/visual/common-enemy-variants.ts`, giving each common enemy a deterministic visual variant based on `enemy.id` and template family.
- Common enemies now have four sub-silhouette variants per template. Variants affect visible art-only traits such as wing span, armor bulk, antenna count, engine count, horn/nose length, side pod scale, sensor offset, and asymmetry.
- Integrated variants into `src/client/visual/sprites/common-enemy-sprites.ts` without changing enemy health, radius, speed, contact damage, spawn rules, or targeting.
- Added `tests/client/common-enemy-variants.test.ts` to lock stable variant selection and ensure every common enemy family exposes multiple sub-silhouettes.

QA expectation:

- Dense screenshots should show less copy-paste repetition inside the same common enemy family.
- This is still a first sub-silhouette pass. The next enemy-art pass should add true authored 4-frame body-frame differences, family-specific hit frames, and stronger recent-Wishcraft drift pieces integrated into fins, armor plates, sensors, and thrusters.

### `hd2d-cyberpixel-v8`

Completed in this pass:

- Added `src/client/visual/boss-encounter-vfx.ts`, a dedicated visual-only Boss encounter stage layer.
- Boss warning/active phases now render extra rift arcs, lock-on scan lattices, dragon threat slashes, and rival-theme motif shards around each Boss.
- The layer scales by Boss count, warning/active phase, and Boss health pressure, without changing Boss health, damage, spawn schedule, player movement, or combat rules.
- Integrated the layer into `src/client/rendering/combat-renderer.ts` as a separate `Graphics` layer between Boss presence and late-run field effects.
- Added `tests/client/boss-encounter-vfx.test.ts` for threat-mark density and pressure scaling.

QA expectation:

- Boss encounters should feel less like static oversized enemies and more like staged dragon-mech threats with warning pressure and active lock-on energy.
- This does not replace the still-needed Boss asset work: entrance animation, attack telegraph sprites, hit-break armor states, death shatter, and stronger silhouette-specific attachment integration remain open.

### `hd2d-cyberpixel-v9`

Completed in this pass:

- Added `src/client/visual/boss-damage-overlay.ts`, a visual-only Boss armor-break and exposed-core overlay.
- Bosses now reveal silhouette-specific damage art as health drops:
  - Flying Bosses show wing/side armor breaks and cracked wing paths.
  - Crawling Bosses show long body plate loss and segmented hull cracks.
  - Humanoid Bosses show torso/shoulder plate damage and exposed reactor marks.
- Damage overlay scales from `healthProgress`; fresh Bosses remain intact, wounded Bosses gain cracks, exposed cores, fault sparks, and broken plate shapes.
- Integrated the overlay into `src/client/visual/boss-entity-sprites.ts` after the base silhouette draw and before attachment overlays, keeping silhouette files focused on base body construction.
- Added `tests/client/boss-damage-overlay.test.ts` for damage thresholds and crack-density scaling.

QA expectation:

- Bosses should no longer look identical throughout the entire fight. Lower-health Bosses should visibly degrade before victory.
- The next Boss pass should add entrance body animation, attack telegraph sprites tied to silhouette anatomy, and a death-shatter sequence. Those remain required before claiming Boss quality is near the target.

### `hd2d-cyberpixel-v10`

Completed in this pass:

- Added `docs/visual-asset-requirements.md` as the production asset inventory for player mech, common enemies, Bosses, summons, Wishcraft skill effects, theme motifs, arena phases, UI, and QA evidence.
- Promoted Wishcraft skill effects to a first-class asset package with required emitter, body, travel, contact, residue, and screen-accent layers.
- Added `src/client/visual/wishcraft/mechanic-accent-vfx.ts` as a thin entrypoint over focused modules under `src/client/visual/wishcraft/mechanic-accent/`.
- Added mechanism-family accent drawing for projectile bodies and impact feedback. Scatter, beam, spiral, ricochet, missile, melee, area, burst, summon, shield, pickup, trigger, stat-support, and lance families now have additional shape language beyond palette and theme motifs.
- Integrated mechanic accents into `wishcraft-projectile-vfx.ts` and `combat-feedback-vfx.ts` without changing combat damage, cooldowns, targeting, movement, XP, or Boss rules.
- Added `tests/client/wishcraft-mechanic-accent-vfx.test.ts` to lock the visual-only mechanic-family mapping and accent budget expectations.

QA expectation:

- Wishcraft hits should be easier to distinguish by mechanic family in still screenshots, especially scatter, ricochet, missile, spiral, trigger, and shield effects.
- This is not a full skill-VFX completion pass. Summon-origin firing, persistent shield shells, pickup magnet path richness, stronger melee subfamilies, and all-theme motif expansion remain required before claiming the Wishcraft spectacle target is met.

Engineering structure note:

- New Wishcraft skill-effect work should continue under `src/client/visual/wishcraft/` with focused modules and tests. The root `src/client/visual/wishcraft-projectile-vfx.ts` and `src/client/visual/combat-feedback-vfx.ts` should stay as orchestration/call sites, not broad asset catalogs.

### `hd2d-cyberpixel-v11`

Completed in this pass:

- Added `src/client/visual/sprites/common-enemy-frame-art.ts` for authored 4-frame living common-enemy body parts.
- Added `src/client/visual/sprites/common-enemy-drift-sockets.ts` for body-mounted recent-Wishcraft drift sockets on common enemies.
- Integrated both modules into `src/client/visual/sprites/common-enemy-sprites.ts` without changing enemy radius, health, speed, contact damage, XP, spawn pressure, targeting, or collision.
- Fast Fragile enemies now gain frame-specific fins, heat sinks, side limb segments, and rivet layouts.
- Slow Tough enemies now gain heavier frame-specific treads, armor plates, cables, side pods, and sensor slits.
- Swarm Fragile enemies now gain frame-specific wing sheets, extra micro nodes, cable links, and fluttering body pieces.
- Recent Wishcraft themes now mount onto common-enemy bodies through wings, side pods, cores, armor rims, and drone nodes instead of reading only as generic exterior ornaments.
- Added `tests/client/common-enemy-frame-art.test.ts` to lock four distinct living frame signatures, family part budgets, and drift socket activation.

QA expectation:

- Dense horde screenshots should show less repeated living-enemy art, with frame and family differences visible even before death effects.
- Common enemies should better express the player recent-Wishcraft visual drift while staying small enough for survivor-like horde readability.
- This still does not complete common-enemy production quality. Remaining work includes visual QA screenshots, stronger hit-frame redraws, even richer per-family silhouettes at mobile scale, and a later pass to tune sprite readability against real late-run particle saturation.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The screenshot shows materially richer common-enemy mechanical detail than the original simple-token state, including additional frame parts, body-mounted drift sockets, and heavier slow-tough crawler parts.
- The overall commercial-art goal is still not met. At horde density, slow-tough units can still read too similarly, player/Boss art needs further authored animation and silhouette polish, and Wishcraft evolved-weapon spectacle still needs stronger summon, shield, pickup, trigger, and melee family passes.

### `hd2d-cyberpixel-v12`

Completed in this pass:

- Added `src/client/visual/wishcraft-spectacle-vfx.ts` as a dedicated transient VFX layer for high-spectacle non-projectile Wishcraft families.
- Added `src/client/visual/wishcraft/spectacle/types.ts` and `src/client/visual/wishcraft/spectacle/motif.ts` to keep spectacle rules and motif stamps separate from renderer lifetime code.
- Integrated the new spectacle pool into `src/client/rendering/feedback-renderer.ts` alongside existing launch, projectile, trail, particle-cloud, and screen-pulse pools.
- Melee Wishcraft hits now gain oversized blade arcs and shard strokes, making melee crafts read more like super-weapon slashes instead of generic contact sparks.
- Shield effects now gain layered shell rings and guard marks, improving the defensive fantasy without adding damage-over-time or changing shield mechanics.
- Summon effects now gain follower-link fire shapes and satellite shot lines, improving the sense that summons are firing.
- Pickup/XP effects now gain curved magnet lanes, improving the visual reward for pickup/magnet Wishcrafts.
- Trigger effects now gain stronger break sigils, radial shards, rings, and longer-lived spectacle timing.
- Added `tests/client/wishcraft-spectacle-vfx.test.ts` to lock non-projectile spectacle eligibility, family budgets, runtime shield/summon/XP support, and lifetime progress.

QA expectation:

- First-Wishcraft and late-run screenshots should show more visible reward moments for melee, shield, summon, pickup, and trigger wishes.
- This pass is still visual-only. It does not change damage, cooldowns, targeting, summon behavior, shield rules, XP collection, or movement.
- Remaining Wishcraft work: richer summon-origin projectile bodies, persistent shield shell around the player, pickup trails tied to actual XP shard paths, stronger theme-specific motifs across all 24 themes, and short QA clips for launch/travel/impact/fade.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The static QA scene shows stronger trigger/area energy and more layered non-projectile effects than before this pass.
- The new spectacle layer is still partly swallowed by dense enemies, background field lines, and existing particle clutter. The next Wishcraft pass should focus on persistent, readable sources: a shield shell around the player, visible summon-origin shots, and XP-magnet paths tied to shard movement rather than only short-lived target-centered bursts.

### `hd2d-cyberpixel-v13`

Completed in this pass:

- Added `src/client/visual/wishcraft-persistent-source-vfx.ts`, a visual-only persistent source layer for Wishcraft effects that were too easy to lose as short-lived target bursts.
- Integrated the layer into `src/client/rendering/combat-renderer.ts` as a single `Graphics` pass using current runtime state.
- Active shield value now draws a persistent player-centered shell with layered rings, guard marks, and shield-value scaling.
- Attracted XP shards now draw longer world-space magnet lanes from shard positions toward the player, making pickup/magnet wishes readable in still screenshots.
- Active summons now draw persistent links and small firing lanes around follower positions, improving summon-origin readability without changing summon mechanics.
- Added `tests/client/wishcraft-persistent-source-vfx.test.ts` for shield ring budgets, XP magnet lane clamping, and summon link budgets.

QA expectation:

- Dense combat screenshots should show the player shield shell and XP magnet lanes as continuous sources instead of only target-centered impact flashes.
- Summon Wishcrafts should read more like follower weapons because the follower positions remain visually linked to the player and show local firing lanes.
- This pass remains visual-only. It does not change shield capacity/value, XP attraction speed/range, summon position/orbit, damage, cooldowns, targeting, or movement.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The QA scene now includes an explicit shield craft/runtime state so the persistent shell is visible in screenshots.
- The player-centered shield shell is readable near the mech, and the scene keeps mixed-theme color balance by avoiding shield as the latest loadout tint.
- The effect still needs mobile portrait verification and a true gameplay clip. A still screenshot proves the persistent source layer renders, but it does not prove final evolved-weapon spectacle quality.

### `hd2d-cyberpixel-v14`

Completed in this pass:

- Added `src/client/visual/boss-state-overlay.ts`, a silhouette-aware Boss state overlay for entrance, attack telegraph, and low-health shatter-readiness visuals.
- Integrated the overlay into `src/client/visual/boss-entity-sprites.ts` after base body and damage overlay, before generic telegraph rings and attachments.
- Flying dragon Bosses now get anatomy-tied wing charge lanes and core charge during telegraph.
- Crawling dragon Bosses now get claw charge marks and body-core charge during telegraph.
- Humanoid dragon Bosses now get arm-cannon charge and torso reactor charge during telegraph.
- Warning-phase entrance now draws anatomy anchor streaks instead of only changing alpha/rings.
- Low-health Bosses now show extra shatter-ready plate fragments and reactor pressure, making near-death state more readable before victory.
- Added `tests/client/boss-state-overlay.test.ts` for entrance intensity, telegraph intensity, shatter readiness, and silhouette-specific anatomy anchor counts.

QA expectation:

- Boss screenshots should show more of the Boss body participating in state changes, rather than only surrounding rings.
- This is still visual-only. It does not change Boss health, damage intake, encounter timing, Boss count, reward XP, player movement, or combat rules.
- Remaining Boss work: a full death-shatter sequence after victory, stronger entrance staging before active combat, per-silhouette attack pose changes in the base body itself, and mobile readability screenshots.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The full late-run QA scene still does not isolate Boss body detail well enough; enemy density and projectile layers cover much of the active Boss.
- The overlay is integrated and covered by tests, but future Boss work needs a Boss-focused QA scene or viewport that captures warning, active telegraph, low-health, and double-Boss states separately.

### `hd2d-cyberpixel-v15`

Completed in this pass:

- Split Pixi rendering infrastructure out of `src/client/rendering/combat-renderer.ts`:
  - `src/client/rendering/pixi-stage.ts` owns explicit combat layer order and camera transform.
  - `src/client/rendering/render-cache.ts` owns render cache construction.
  - `src/client/rendering/entity-sync.ts` owns reusable map-cache synchronization.
- Added `tests/client/rendering-stage-structure.test.ts` and `tests/client/rendering-entity-sync.test.ts` so future visual additions preserve layer order, cache boundaries, and rebuild-on-cache-key behavior.
- Added `src/client/visual/sprites/boss/boss-state-body-parts.ts`, a Boss-silhouette body-state module for entrance panels, telegraph weapons, exposed cores, and shatter plates.
- Integrated Boss state body parts into the flying, crawling, and humanoid dragon Boss sprite modules using real `healthProgress`, not gameplay changes or inferred animation state.
- Added `tests/client/boss-state-body-parts.test.ts` to lock state-part budgets for warning, telegraph, and low-health Boss visuals.
- Updated `artifacts/visual-polish/qa-boss-scene.html` from a compressed 2x2 overview into stacked 16:9 Boss-detail panels with camera focus on Boss positions.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v15` so cached entity visuals rebuild after the Boss-state sprite pass.

QA artifact:

- `artifacts/visual-polish/qa-boss-scene.png`

QA result:

- The Boss-detail screenshot now makes warning, active telegraph, low-health, and double-Boss states inspectable at useful scale.
- Flying and humanoid Boss silhouettes now show additional state-tied body pieces instead of relying only on surrounding rings and global overlays.
- This pass improves Boss asset readability but does not complete the Boss package. Full entrance staging, silhouette-specific pose animation, and death-shatter sequences remain required before Boss art can be considered close to the target.

Engineering structure result:

- `src/client/rendering/combat-renderer.ts` is back under the current split threshold and should stay as Pixi boot plus per-frame orchestration.
- New render layers, cache families, or entity map sync behavior must go through the focused `rendering/` modules first.
- New Boss sprite state work must live under `src/client/visual/sprites/boss/` or another focused Boss module, not in `boss-entity-sprites.ts` as mixed drawing logic.

### `hd2d-cyberpixel-v16`

Completed in this pass:

- Added `src/client/visual/wishcraft-pattern-vfx.ts` as a dedicated evolved-weapon pattern layer for large, readable Wishcraft attack shapes.
- Added focused pattern submodules:
  - `src/client/visual/wishcraft/pattern/types.ts` maps legal feedback facts into visual-only pattern profiles.
  - `src/client/visual/wishcraft/pattern/motif.ts` draws theme-aware motif stamps for pattern bodies.
- Added a dedicated `wishcraftPatternLayer` in `src/client/rendering/pixi-stage.ts`, ordered after launch/projectile layers and before player attachments. Pattern VFX no longer share the background-oriented screen pulse layer.
- Integrated the pattern VFX pool into `src/client/rendering/feedback-renderer.ts` and `src/client/rendering/render-cache.ts`.
- Added `tests/client/wishcraft-pattern-vfx.test.ts` for pattern eligibility, spiral mechanic recognition, density budgets, and lifetime progress.
- Expanded `tests/client/rendering-stage-structure.test.ts` so the pattern layer placement and cache initialization stay locked.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v16` so runtime visual caches rebuild after the new Wishcraft pattern layer.

QA artifact:

- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The QA combat screenshot now shows stronger large-scale Wishcraft pattern identity: beam prism lanes, scatter fan lines, ricochet nodes, missile arcs, trigger sigils, radial burst spokes, summon links, and area nova geometry.
- Pattern VFX are visible above dense common enemies while staying below the player attachment/player layers, so the skill reward reads more clearly without fully covering the mech.
- This improves the typed-wish reward moment, but the evolved-weapon target is still not complete. Remaining work includes longer animation clips, stronger per-theme pattern differences for all 24 themes, summon-origin projectile bodies, and mobile portrait readability evidence.

### `hd2d-cyberpixel-v17`

Completed in this pass:

- Added `src/client/visual/wishcraft/pattern/theme-kits.ts`, a 24-theme pattern kit table for Wishcraft evolved-weapon visuals.
- Each catalog theme now has a distinct pattern glyph and visual parameters for angle offset, lane skew, ring bias, motif scale, and secondary alpha.
- Integrated theme kits into `src/client/visual/wishcraft-pattern-vfx.ts`, so the pattern layer changes geometry and glyph language by theme, not only palette or broad motif group.
- Added stronger near-field identity marks inside every pattern so themes in the same motif group, such as Starfire/Solar, Frost/Crystal, Dragon/Demon, and Music/Quantum, no longer rely only on color.
- Added `tests/client/wishcraft-pattern-theme-kits.test.ts` to lock 24-theme coverage, unique pattern signatures, fallback behavior, and related-theme glyph separation.
- Added `artifacts/visual-polish/qa-wishcraft-theme-patterns.html`, a single-Pixi-app contact sheet that renders all 24 theme pattern kits without creating 24 WebGL contexts.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v17` so pattern visuals rebuild after the theme-kit pass.

QA artifacts:

- `artifacts/visual-polish/qa-wishcraft-theme-patterns.png`
- `artifacts/visual-polish/qa-combat-scene.png`

QA result:

- The theme contact sheet now renders all 24 panels without the earlier multi-canvas white panels, and each theme shows a distinct center/near-field glyph language on top of palette differences.
- The real combat QA screenshot remains readable with the stronger theme glyphs; pattern VFX still sit above enemies and below player/player-attachment layers.
- This pass improves Wishcraft visual freshness for player-authored wishes, but final visual completion is still unproven. Remaining gaps include mobile portrait evidence, animation clips, stronger player mech base art, and fuller Boss entrance/death sequences.

### `hd2d-cyberpixel-v18`

Completed in this pass:

- Added `src/client/visual/sprites/player-mech-frame-art.ts`, a focused player-mech frame-art module for dense base-body detail.
- The player mech now draws additional armor panels, silhouette cut-ins, backpack vents, asymmetric sockets, cable/heat-sink detail, and movement-derived leg/thruster pose without changing movement, targeting, damage, XP, or cooldown rules.
- Integrated the frame-art module into `src/client/visual/sprites/player-mech-sprite.ts` while keeping `combat-renderer.ts` as Pixi orchestration.
- Added `tests/client/player-mech-frame-art.test.ts` to lock idle density, movement-driven silhouette/thruster changes, and visual-only animation derivation.
- Added `src/client/visual/qa/player-mech-qa-scene.ts`, a player-focused QA scene module with testable scenario data for fresh idle, movement thrust, dense 5-Wishcraft loadout, and mobile portrait crop.
- Added `artifacts/visual-polish/qa-player-mech-scene.html` as a thin HTML shell over the QA module. The page uses one Pixi canvas to avoid multi-context white-panel failures.
- Added `tests/client/player-mech-qa-scene.test.ts` to lock player QA coverage, legal catalog visual pieces, dense attachment count, and mobile portrait aspect.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v18` so runtime visual caches rebuild after the player-mech base-art pass.

QA artifact:

- `artifacts/visual-polish/qa-player-mech-scene.png`

QA result:

- The player-focused screenshot shows four inspectable states: idle base body, diagonal movement thrust, 5-Wishcraft dense attachment/shield state, and mobile portrait crop.
- Programmatic screenshot checks confirmed a 1520 x 672 nonblank PNG with meaningful bright-pixel density and no white-panel failure.
- Player silhouette is materially stronger than before this pass, especially at large inspection scale and under 3+ Wishcraft attachment pressure.
- This pass does not complete the player asset package. Remaining player work includes authored 4-6 frame idle animation, base machine-gun launch, laser-sword windup/active/fade, hit flicker, Wishcraft install snap-on, and gameplay-scene mobile screenshots with HUD/joystick present.

### `hd2d-cyberpixel-v19`

Completed in this pass:

- Added a dedicated Wishcraft cinematic VFX domain:
  - `src/client/visual/wishcraft/cinematic/types.ts` owns visual-only family selection, budgets, origins, and lifetime progress.
  - `src/client/visual/wishcraft-cinematic-vfx.ts` owns the Pixi drawing for high-intensity skill animation layers.
- Cinematic VFX now add stronger mid-frame reward visuals for core Wishcraft attack families:
  - Beam Overdrive: layered beam lanes, bright caps, and path particles.
  - Lance Break: spear body, afterimage rails, and impact core.
  - Scatter Barrage / Spiral promotion: fan lanes, projectile afterimages, and motif particles.
  - Missile Bloom: arcing salvos, missile bodies, and explosion bloom.
  - Nova Detonation / Burst: radial shock spokes, bright core, rings, and theme glyphs.
  - Blade Storm: large melee arcs and theme glyph marks near the player.
  - Summon Salvo: follower-style firing nodes and shot lanes.
  - Trigger Rupture: square rupture frames, shards, rings, and dense particles.
- Integrated the cinematic pool into `src/client/rendering/feedback-renderer.ts` and `src/client/rendering/render-cache.ts` as a separate transient cache family. The new layer consumes existing combat feedback only; it does not change damage, cooldowns, targeting, movement, XP, shield, summon, or Boss rules.
- Added `tests/client/wishcraft-cinematic-vfx.test.ts` for family coverage, budget hierarchy, spiral promotion, origin selection, and lifetime progress.
- Added `src/client/visual/qa/wishcraft-cinematic-qa-scene.ts`, a single-Pixi-app contact sheet for eight high-spectacle Wishcraft families across eight themes.
- Added `tests/client/wishcraft-cinematic-qa-scene.test.ts` to lock contact-sheet coverage.
- Added `artifacts/visual-polish/qa-wishcraft-cinematic-scene.html` and captured `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png`.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v19` so runtime visual caches rebuild after the cinematic VFX pass.

QA artifact:

- `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png`

QA result:

- The cinematic contact sheet renders eight distinct skill-animation grammars on one Pixi canvas: beam, lance, scatter, missile, area nova, melee blade, summon salvo, and trigger rupture.
- Programmatic screenshot checks confirmed a 1440 x 600 nonblank PNG with meaningful bright-pixel density and no white-panel failure.
- This pass improves the “typed wish becomes a visible power” reward moment, but it is still not final commercial-level proof. Remaining Wishcraft work includes animation clips, stronger runtime gameplay screenshots under horde density, summon-origin projectile bodies in live motion, persistent shield side-hit animation, pickup trails tied to actual shard paths, and mobile portrait evidence.

### `hd2d-cyberpixel-v20`

Completed in this pass:

- Added Boss victory/death-shatter VFX to `src/client/visual/boss-encounter-vfx.ts`.
- Boss victory phase now uses `completedPlan` to draw visual-only death-shatter effects after combat completion:
  - Core burst glow.
  - Shock spokes.
  - Rival-theme residue rings.
  - Large armor plate fragments.
  - Theme motif sparks.
  - Separate shatter clusters for double-Boss encounters.
- Added exported budget/progress helpers:
  - `bossVictoryShatterProfile`
  - `bossVictoryShatterProgress`
- Expanded `tests/client/boss-encounter-vfx.test.ts` so death-shatter density scales with Boss count and fades by runtime progress.
- Updated `artifacts/visual-polish/qa-boss-scene.html` with a fifth `VICTORY / DEATH SHATTER` panel using `completedPlan` and `phase: "victory"`.
- Re-captured `artifacts/visual-polish/qa-boss-scene.png` with warning, active telegraph, low-health shatter-ready, double-Boss, and victory death-shatter panels.

QA artifact:

- `artifacts/visual-polish/qa-boss-scene.png`

QA result:

- The Boss QA screenshot now shows a concrete death-shatter state instead of ending Boss validation at low-health readiness.
- The victory panel renders separate left/right Boss shatter clusters with plate fragments, core bursts, and residue rings, proving double-Boss death visuals are no longer blank or generic.
- This pass is visual-only. It does not change Boss health, damage, XP reward, phase scheduling, player healing, arena phase advance, or combat mechanics.
- Remaining Boss work includes stronger entrance staging, silhouette-specific pose animation, active attack animation clips, stronger hit-frame redraw, and mobile Boss readability evidence.

### `hd2d-cyberpixel-v21`

Completed in this pass:

- Added `src/client/visual/qa/mobile-combat-qa-scene.ts`, a focused portrait-combat QA scene that boots the normal Pixi arena renderer against a synthetic late-run mobile state.
- Added `artifacts/visual-polish/qa-mobile-combat-scene.html` as a thin one-canvas HTML shell with production-like mobile HUD overlays: XP bar, Boss name/health, score, player `Lv.xxx`, player health, and bottom-center joystick.
- Added `tests/client/mobile-combat-qa-scene.test.ts` to lock the portrait viewport, horde pressure, loadout size, and theme variety for future visual regression work.
- Captured `artifacts/visual-polish/qa-mobile-combat-scene.png` at 390 x 844 with dense common enemies, active Boss pressure, seven Wishcraft themes, summons, XP shards, shield state, player HUD, and joystick present.

QA artifact:

- `artifacts/visual-polish/qa-mobile-combat-scene.png`

QA result:

- Programmatic screenshot checks confirmed a nonblank 390 x 844 portrait PNG with meaningful bright-pixel density and no white-panel failure.
- Visual inspection confirms the top XP/Boss HUD, player level label, player health bar, center player silhouette, and bottom joystick remain readable under dense enemy and Wishcraft VFX pressure.
- This pass supplies the first mobile gameplay-scene evidence for the visual package. It does not complete mobile polish: the player still needs authored base-weapon animation frames, common enemies need stronger hit-frame redraws at small scale, Bosses need mobile-focused silhouette-state evidence, and Wishcraft spectacle still needs motion clips for launch, travel, impact, and fade.

### `hd2d-cyberpixel-v22`

Completed in this pass:

- Split base weapon VFX into focused modules under `src/client/visual/base-kit/`:
  - `types.ts` owns visual-only profile budgets, lifetime stages, and frame signatures.
  - `machine-gun.ts` owns muzzle charge, segmented tracer body, shell/ion pixel ejection, and contact burst drawing.
  - `laser-sword.ts` owns hilt charge, windup/active/fade blade arcs, afterimage fan, and contact shards.
- Kept `src/client/visual/base-kit-vfx.ts` as the feedback-renderer entrypoint and lifetime adapter instead of adding base weapon art to `combat-loop.ts` or `arena.ts`.
- Changed active base weapon VFX from one-time static drawing plus scale fade into progress-driven frame redraw, so windup, active, and fade states have different silhouettes.
- Added `tests/client/base-kit-vfx.test.ts` to lock the visual-only profile budgets and frame signatures for both base weapons.
- Added `src/client/visual/qa/base-kit-weapon-qa-scene.ts` and `tests/client/base-kit-weapon-qa-scene.test.ts` to cover six inspectable weapon frames.
- Added `artifacts/visual-polish/qa-base-kit-weapon-scene.html` and captured `artifacts/visual-polish/qa-base-kit-weapon-scene.png`.

QA artifact:

- `artifacts/visual-polish/qa-base-kit-weapon-scene.png`

QA result:

- The contact sheet shows six readable frames: machine-gun windup, active, fade, laser-sword windup, active, and fade.
- The machine-gun now reads as a charged mech weapon shot with muzzle flash, segmented cyan plasma tracer, magenta/cyan subsegments, ejected pixels, and target contact shards.
- The laser sword now reads as a staged close-range weapon animation with hilt charge, bright blade core, larger active sweep, afterimage fan, and fading contact shards.
- This pass is visual-only. It does not change base weapon damage, cooldowns, ranges, targeting, enemy health, player movement, or Wishcraft mechanics.
- Remaining player-base-weapon work: tie muzzle/hilt origins more tightly to visible player weapon sockets, add in-combat motion clips, and tune target-side hit feedback so it complements rather than duplicates the new weapon frames.

### `hd2d-cyberpixel-v23`

Completed in this pass:

- Added `src/client/visual/base-kit-emitter-sockets.ts`, a visual-only socket resolver for base weapon feedback.
- Machine-gun VFX now shifts from the simulation origin at player center to the left or right visible forearm rail based on target side.
- Laser-sword VFX now shifts from player center to the left or right close-combat sword hilt based on target side.
- Integrated the resolver in `src/client/rendering/feedback-renderer.ts` before creating base-kit VFX, leaving simulation feedback, targeting, damage, range, and cooldowns unchanged.
- Updated `src/client/visual/qa/base-kit-weapon-qa-scene.ts` so the base weapon contact sheet renders both the weak simulation center and the actual socket origin, making the visual-origin correction inspectable.
- Added `tests/client/base-kit-emitter-sockets.test.ts` and expanded the QA scene test so all six contact-sheet frames use shifted socket origins.
- Re-captured `artifacts/visual-polish/qa-base-kit-weapon-scene.png`.

QA artifact:

- `artifacts/visual-polish/qa-base-kit-weapon-scene.png`

QA result:

- The contact sheet now shows a faint center reference and a brighter weapon socket origin for every base weapon frame.
- Machine-gun windup/active/fade frames originate from the forearm rail instead of the center of the player body.
- Laser-sword windup/active/fade frames originate from the close-combat hilt side instead of the center of the player body.
- This pass is visual-only. It does not change combat simulation facts or mechanic balance.
- Remaining player-base-weapon work: capture live combat clips with the actual player sprite visible under the socket-origin VFX, and further tune target-side impact feedback so it reads as enemy contact rather than a second weapon source.

### `hd2d-cyberpixel-v24`

Completed in this pass:

- Added optional `targetTemplateId` and `targetRadius` visual hints to base impact and Wishcraft hit feedback.
- Base machine-gun, base laser-sword, and Wishcraft hit feedback now carry the target common-enemy family when the simulation already knows it.
- Added `src/client/visual/common-enemy-hit-vfx.ts`, a focused short-lived hit-frame VFX module for common enemies:
  - Fast Fragile hits use harrier wing-shear shards, core blink, and directional tear lanes.
  - Slow Tough hits use armor-plate buckle fragments, hull cracks, heavier rings, and cross-body fracture lines.
  - Swarm Fragile hits use node-disruption flashes, small linked node sparks, and radial interference spokes.
- Integrated the hit VFX into `src/client/visual/combat-feedback-vfx.ts` before generic impact feedback, so enemy-family hits no longer collapse to one shared spark.
- Updated feedback cache signatures in `src/client/rendering/feedback-renderer.ts` so template/radius visual hints affect transient VFX identity.
- Added `tests/client/common-enemy-hit-vfx.test.ts` for family profiles, budgets, radius scaling, and TTL differences.
- Added `src/client/visual/qa/common-enemy-hit-qa-scene.ts`, `tests/client/common-enemy-hit-qa-scene.test.ts`, and `artifacts/visual-polish/qa-common-enemy-hit-scene.html`.
- Captured `artifacts/visual-polish/qa-common-enemy-hit-scene.png`.

QA artifact:

- `artifacts/visual-polish/qa-common-enemy-hit-scene.png`

QA result:

- The contact sheet shows all three common-enemy families under base and Wishcraft hit sources.
- Fast Fragile reads as side-fin/wing shearing; Slow Tough reads as armor plates buckling and cracking; Swarm Fragile reads as clustered nodes flickering and disrupting.
- This pass is visual-only. It does not change enemy health, speed, contact damage, spawn pressure, targeting, collision radius, base weapon damage, or Wishcraft mechanics.
- Remaining common-enemy work: author true living hit-pose redraws inside the enemy sprites, tune hit feedback at real horde density, and capture mobile portrait evidence under particle saturation.

### `hd2d-cyberpixel-v25`

Completed in this pass:

- Split Boss action-pose rendering into focused modules under `src/client/visual/sprites/boss/action-pose/`:
  - `profile.ts`: visual-only pose budgets and signatures.
  - `anchors.ts`: silhouette-specific body anchors.
  - `entrance.ts`: materialization panels and rift-frame pose pieces.
  - `flying-attack.ts`: expanded wing pose blades, wing struts, and head/core charge.
  - `crawling-attack.ts`: head lunge, larger claw strike silhouettes, spine charge, and ground scrape lanes.
  - `humanoid-attack.ts`: raised arm cannons, larger muzzle blocks, elbow joints, and exposed reactor pressure.
  - `stagger.ts`: low-health loose plates, exposed cores, and fracture lanes.
- Kept `src/client/visual/sprites/boss/boss-action-pose.ts` as a small facade so Boss sprite assembly stays stable while pose art can expand by state/silhouette.
- Added `src/client/visual/qa/boss-action-pose-qa-scene.ts`, `tests/client/boss-action-pose-qa-scene.test.ts`, and `artifacts/visual-polish/qa-boss-action-pose-scene.html` as an inspection-scale Boss asset sheet.
- Re-timed `artifacts/visual-polish/qa-boss-scene.html` active/double-Boss scenarios so the full-combat Boss detail sheet samples stronger telegraph moments.
- Added Boss action-pose test coverage for peak attack budgets so future changes do not collapse flying wing blades, crawler claw strikes, or humanoid arm cannons back into subtle overlays.
- Captured `artifacts/visual-polish/qa-boss-action-pose-scene.png` and refreshed `artifacts/visual-polish/qa-boss-scene.png`.

QA artifacts:

- `artifacts/visual-polish/qa-boss-action-pose-scene.png`
- `artifacts/visual-polish/qa-boss-scene.png`

QA result:

- The new inspection sheet shows all three Boss silhouettes with complete body framing across entrance, peak attack, and low-health states.
- Flying Bosses now have clearer wing-spread and blade posture, crawling Bosses now read more as forward-lunging dragon-mechs with claw pressure, and humanoid Bosses now show raised arm-cannon silhouettes.
- The full-combat Boss detail sheet still makes some action-pose pieces small under real arena framing. This pass improves Boss action-pose assets, but it does not complete the Boss package.
- This pass is visual-only. It does not change Boss health, damage, spawn schedule, player movement, targeting, XP rewards, or encounter mechanics.
- Remaining Boss work: stronger live entrance staging, active attack animation clips, hit-frame body redraws, mobile Boss readability, and tuning so the inspection-scale pose improvements remain readable in full combat.

### `hd2d-cyberpixel-v26`

Completed in this pass:

- Added `src/client/visual/sprites/common-enemy-hit-frame-art.ts`, a focused living-sprite hit-pose module for common enemies.
- Integrated living hit-frame redraws into `src/client/visual/sprites/common-enemy-sprites.ts` after authored frame art and before drift sockets, so damage appears on the enemy body rather than only as a floating overlay.
- Fast Fragile enemies now get body-authored wing shear, displaced fins, core crack marks, and fracture lanes during hit frames.
- Slow Tough enemies now get buckled armor panels, cracked hull lanes, side tread displacement, and exposed core slits during hit frames.
- Swarm Fragile enemies now get scattered node joints, broken link lines, and cracked center cores during hit frames.
- Reduced the generic white hit flash fill/stroke in the common-enemy sprite layer so it no longer hides the actual body art.
- Updated `src/client/visual/qa/common-enemy-hit-qa-scene.ts` so the contact sheet renders real common-enemy sprites with recent-Wishcraft drift, living hit-pose redraws, and the existing hit VFX together instead of showing only silhouette hints.
- Expanded `tests/client/common-enemy-frame-art.test.ts` and `tests/client/common-enemy-hit-qa-scene.test.ts` for family-specific hit-frame budgets and QA loadout coverage.
- Re-captured `artifacts/visual-polish/qa-common-enemy-hit-scene.png`.

QA artifact:

- `artifacts/visual-polish/qa-common-enemy-hit-scene.png`

QA result:

- The contact sheet now proves the hit response is attached to real enemy body art: the Fast, Slow, and Swarm families retain distinct silhouettes while showing body-local damage pieces and recent-Wishcraft drift.
- This is a visual-only pass. It does not change enemy health, speed, contact damage, spawn pressure, targeting, collision radius, base weapon damage, Wishcraft damage, or XP rules.
- Remaining common-enemy work: validate these hit poses in real horde density and mobile portrait combat, tune readability under late-run particles, and eventually capture short clips for locomotion, hit, and death transitions.

### `hd2d-cyberpixel-v27`

Completed in this pass:

- Added a dedicated evolved-weapon Wishcraft VFX domain:
  - `src/client/visual/wishcraft/evolved/types.ts` owns visual-only eligibility, profile budgets, origin selection, and lifetime progress.
  - `src/client/visual/wishcraft/evolved/motif.ts` owns the large Pixi motif drawing for evolved reward forms.
  - `src/client/visual/wishcraft-evolved-vfx.ts` stays as a thin entrypoint for palette/theme-kit lookup, graphic creation, and lifetime update.
- Integrated the evolved VFX pool into `src/client/rendering/feedback-renderer.ts` and `src/client/rendering/render-cache.ts` as another transient feedback family that consumes existing `wishcraft-hit` facts.
- Expanded the Wishcraft cinematic QA sheet from eight to twelve panels so it now isolates beam, lance, scatter, spiral, ricochet, missile, area nova, melee blade, summon salvo, shield prism, pickup vortex, and trigger rupture.
- Added `tests/client/wishcraft-evolved-vfx.test.ts` coverage for family eligibility, spiral promotion, shield/pickup reward budgets, lifetime progress, and the module-boundary split between entrypoint, profile rules, and motif drawing.
- Updated `tests/client/wishcraft-cinematic-qa-scene.test.ts` so future QA sheets keep all twelve high-spectacle families.
- Re-captured `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png` at 1440 x 900 after the label/layout update.

QA artifact:

- `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png`

QA result:

- The new contact sheet shows distinct large reward silhouettes for the previously weak-reading spiral, ricochet, shield, and pickup families. Spiral reads as a rotating corkscrew field, ricochet reads as connected bounce nodes, shield reads as layered guard geometry, and pickup reads as a vortex/magnet path rather than a generic impact ring.
- The sheet also keeps the earlier beam, lance, scatter, missile, nova, blade, summon, and trigger families visible in one single-canvas QA scene.
- This pass is visual-only. It does not change damage, cooldowns, targeting, movement, XP attraction, shield capacity/value, summon behavior, Boss scheduling, enemy spawn pressure, or score rules.
- Remaining Wishcraft work: prove these evolved forms in live horde-density desktop and mobile combat, add motion clips for launch/travel/impact/fade, improve summon-origin projectile bodies, deepen side-specific shield hits, and bind pickup trails more tightly to actual XP shard attraction paths.

### `hd2d-cyberpixel-v28`

Completed in this pass:

- Added `src/client/visual/sprites/player-mech-state-art.ts`, a focused player-state art module for authored idle-frame overlays, armor hit flicker, shield sparks, and Wishcraft install snap-on pieces.
- Extended `PlayerMechAnimationState` with render-only state fields:
  - `idleFrame` selects one of six authored visual frame signatures.
  - `hitFlash` drives body-local shield/flicker energy.
  - `wishInstallProgress` drives install rails and snap-on plates.
- Integrated state art into `src/client/visual/sprites/player-mech-sprite.ts` after frame-art breakup and before the base stamp, so the state pieces read as part of the mech rather than a loose global ring.
- Added render-cache-only runtime derivation in `src/client/rendering/combat-renderer.ts`:
  - `player-hit` feedback creates a short player armor/shield flicker.
  - player loadout signature changes create a short Wishcraft install snap-on moment.
  - no simulation state, movement, damage, cooldown, collision, XP, or Wishcraft mechanics are changed.
- Expanded `src/client/visual/qa/player-mech-qa-scene.ts` and `artifacts/visual-polish/qa-player-mech-scene.html` from four panels to six panels: idle base, movement thrust, dense 5-Wishcraft loadout, hit flicker, Wishcraft install, and mobile portrait.
- Added `tests/client/player-mech-state-art.test.ts` for idle frame signatures, hit-flicker budgets, and install snap-on budgets.
- Expanded player QA and rendering structure tests so the player visual-state coverage and render-only cache fields remain explicit.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v28` so cached player visuals rebuild after the state-art pass.
- Re-captured `artifacts/visual-polish/qa-player-mech-scene.png` at 2264 x 672.

QA artifact:

- `artifacts/visual-polish/qa-player-mech-scene.png`

QA result:

- The six-panel player inspection sheet now shows the mech as a richer authored asset across idle, movement, dense loadout, hit, install, and mobile states.
- Hit flicker reads as body-local armor/shield energy instead of a generic screen flash, and the install panel shows visible rails and incoming plates around the mech, making newly awarded Wishcrafts more physically attached.
- This pass is visual-only. It does not change player movement feel, health, shield rules, attacks, enemy behavior, XP, score, or Wishcraft legality.
- Remaining player work: capture live desktop/mobile combat clips that prove idle frame cycling, hit flicker, install snap-on, and base weapon socket animations remain readable while the player is moving under real horde and particle pressure.

### `hd2d-cyberpixel-v29`

Completed in this pass:

- Added `src/client/visual/sprites/common-enemy-motion-art.ts`, a focused common-enemy motion-art module that owns pure motion profiles plus Pixi drawing for family-specific movement detail.
- Integrated the motion layer into `src/client/visual/sprites/common-enemy-sprites.ts` as a pre-body layer, keeping the sprite factory as a composition entrypoint instead of growing it into another asset dump.
- Fast Fragile enemies now gain engine streaks, dart afterimage pixels, flutter arcs, and compact trail pixels that support the harrier/drone read.
- Slow Tough enemies now gain tread sparks, compression scrape marks, side engine streaks, and vent puffs that support the heavy crawler/blocker read.
- Swarm Fragile enemies now gain micro-node jitter, tiny flutter arcs, trail pixels, and small engine streaks without increasing the core body size.
- Added `tests/client/common-enemy-motion-art.test.ts` to lock family motion budgets, frame variation, and the module-boundary rule that common enemy sprite assembly stays split.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v29` so cached enemy visuals rebuild after the motion-art pass.

QA artifact:

- `artifacts/visual-polish/qa-common-enemy-hit-scene.png`

QA result:

- The common-enemy inspection sheet should now show richer motion language even in still form: Fast panels have sharper exhaust/afterimage reads, Slow panels have ground-scrape and tread energy, and Swarm panels have more separated micro-node flutter.
- This pass is visual-only. It does not change enemy health, speed, contact damage, spawn pressure, targeting, collision radius, player damage, base weapon cadence, Wishcraft mechanics, XP, score, Boss scheduling, or input feel.
- Remaining common-enemy work: validate motion and hit details at real horde density, capture mobile portrait evidence, and add short clips for locomotion/death transitions once the screenshot bar is stable.

### `hd2d-cyberpixel-v30`

Completed in this pass:

- Added `src/client/visual/wishcraft/evolved/ornament.ts`, a focused evolved-Wishcraft ornament module that owns visual-only foreground density budgets and drawing for super-weapon reward effects.
- Integrated ornament drawing into `src/client/visual/wishcraft/evolved/motif.ts` after the core evolved mechanic silhouette is drawn, so the main skill shape remains readable before dense decoration is layered on top.
- Added per-pattern ornament budgets for halo bands, directional ribs, orbit pearls, contrail shards, corkscrew dust, theme glyphs, foreground shards, and star sparks.
- Strengthened spiral and pickup Wishcraft reads with high corkscrew/orbit budgets, strengthened beam with directional ribs, and strengthened missile with contrail shard budgets.
- Added `tests/client/wishcraft-evolved-ornament.test.ts` to lock visual density, family-specific ornament language, and the module-boundary split across evolved profile, motif, ornament, and entrypoint files.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v30` so cached evolved Wishcraft visuals rebuild after the ornament pass.

QA artifact:

- `artifacts/visual-polish/qa-wishcraft-cinematic-scene.png`

QA result:

- The Wishcraft cinematic contact sheet should now read as denser super-weapon reward art: every evolved family gains additional foreground fragments, glyphs, sparks, and secondary motion cues while retaining its existing beam, spiral, ricochet, missile, shield, pickup, summon, trigger, melee, nova, lance, or scatter silhouette.
- This pass is visual-only. It does not change Wishcraft damage, cooldowns, targeting, projectile count, shield capacity, pickup attraction, summon behavior, trigger rules, enemy behavior, XP, Boss scheduling, score, or input feel.
- Remaining Wishcraft work: capture live horde-density desktop and mobile combat evidence, add short motion clips for launch/travel/impact/fade, improve summon-origin projectile bodies, deepen side-specific shield hits, and bind pickup trails more tightly to actual XP shard paths.

### `hd2d-cyberpixel-v31`

Completed in this pass:

- Added `src/client/visual/sprites/boss/boss-armor-detail.ts`, a focused Boss armor-detail module that owns pure visual density profiles and drawing for persistent high-resolution dragon-mech details.
- Integrated the armor-detail layer into `src/client/visual/boss-entity-sprites.ts` immediately after the base silhouette and before action poses, damage, state overlays, telegraph, and runtime attachments.
- Flying Dragon Bosses gain wing micro-panels, side engine vents, weapon rails, charged wing sockets, crown spikes, dragon-scale plates, energy seams, exposed reactors, and fracture sparks.
- Crawling Dragon Bosses gain tread plates, claw sockets, hull scale plates, charged body sockets, crown/head spikes, engine vents, exposed reactors, and fracture sparks.
- Humanoid Dragon Bosses gain crown spikes, arm rail sockets, body scale plates, shoulder/torso energy seams, charged reactor sockets, engine vents, exposed reactors, and fracture sparks.
- Added `tests/client/boss-armor-detail.test.ts` to lock base density budgets, silhouette-specific detail language, attack/low-health visual escalation, and the Boss sprite assembly module boundary.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v31` so cached Boss graphics rebuild after the armor-detail pass.

QA artifact:

- `artifacts/visual-polish/qa-boss-action-pose-scene.png`

QA result:

- The Boss action-pose inspection sheet should now show denser dragon-mech construction in every panel before relying on one-off telegraph rings: wing detail for Flying, crawler machinery for Crawling, and humanoid weapon/crown detail for Humanoid.
- This pass is visual-only. It does not change Boss scheduling, Boss health, Boss damage, player attacks, Wishcraft behavior, XP rewards, victory healing, arena phase advancement, enemy spawning, score, or input feel.
- Remaining Boss work: validate these details in full-combat camera framing, capture mobile Boss readability evidence, and add short active-attack clips so entrance, attack, low-health, and death-shatter states are proven in motion.

### `hd2d-cyberpixel-v32`

Completed in this pass:

- Added `src/client/visual/qa/live-combat-spectacle-qa-scene.ts`, a desktop late-run QA scene that boots the real Pixi combat renderer instead of an isolated asset contact sheet.
- Added `artifacts/visual-polish/qa-live-combat-spectacle-scene.html`, a browser artifact for capturing the new 1440 x 900 spectacle frame with live HUD overlays.
- The scenario composes a high-pressure frame with 144 common enemies, two Bosses, 46 XP shards, four summons, twelve Wishcraft loadout entries, and fourteen Wishcraft-hit events spanning lance, beam, scatter, spiral, ricochet, missile, area, melee, summon, shield, pickup, trigger, burst, and stat visual families.
- Added `tests/client/live-combat-spectacle-qa-scene.test.ts` to lock the evidence coverage for enemy count, Boss count, XP density, summon count, theme count, loadout size, Wishcraft-hit count, and visual-family count.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v32` so QA captures and runtime caches rebuild after the live-density evidence pass.

QA artifact:

- `artifacts/visual-polish/qa-live-combat-spectacle-scene.png`

QA result:

- This scene is now the primary wide desktop proof point for whether player, enemies, Bosses, XP shards, summons, Wishcraft projectiles, evolved effects, screen pulses, and HUD can coexist in one late-run frame.
- This pass is visual/evidence-only. It does not change combat simulation, enemy spawning, Boss scheduling, damage, cooldowns, XP, score, Wishcraft mechanics, shield behavior, summon behavior, arena phase rules, or input feel.
- Remaining live-combat work: capture and tune this frame until it reaches the reference density bar, add mobile late-run evidence with the same VFX richness, and add short clips proving launch/travel/impact/fade readability in motion.

### `hd2d-cyberpixel-v33`

Completed in this pass:

- Added `src/client/visual/player-readability-vfx.ts`, a focused visual-only module for preserving player readability inside late-run combat density.
- Added a dedicated `playerReadabilityField` Pixi layer in `src/client/rendering/pixi-stage.ts`, ordered after dense projectiles, patterns, and player attachments but before the player sprite.
- Integrated `drawPlayerReadabilityVfx` into `src/client/rendering/combat-renderer.ts`, deriving visual intensity from existing render facts: enemy count, feedback count, loadout size, active Boss count, and level.
- The focus field adds a local contrast base, thin focus rings, reticle ticks, and shield glints around the player. It does not remove enemies, lower VFX density, change alpha budgets globally, or affect collision/damage.
- Added `tests/client/player-readability-vfx.test.ts` to lock layer order, late-run density scaling, and low-density minimum player anchoring.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v33` so live-combat captures rebuild with the player-readability field.

QA artifact:

- `artifacts/visual-polish/qa-live-combat-spectacle-scene.png`

QA result:

- The late-run wide screenshot should now keep the center player mech and `Lv.xxx` anchor readable without reducing the surrounding Boss, horde, XP, summon, or Wishcraft spectacle density.
- This pass is visual-only. It does not change combat simulation, enemy spawning, enemy behavior, Boss scheduling, damage, cooldowns, XP, score, Wishcraft mechanics, shield behavior, summon behavior, arena phase rules, or input feel.
- Remaining readability work: verify the same focus-field behavior in mobile portrait late-run screenshots and tune center clutter if Boss silhouettes or evolved Wishcraft patterns still overlap too aggressively with the player.

### `hd2d-cyberpixel-v34`

Completed in this pass:

- Added `src/client/visual/qa/mobile-spectacle-qa-scene.ts`, a focused mobile late-run QA scene module that boots the real Pixi combat renderer instead of adding ad hoc screenshot setup to the arena or renderer.
- Added `artifacts/visual-polish/qa-mobile-spectacle-scene.html`, a 390 x 844 portrait browser artifact with top XP/HUD, active Boss panel, player `Lv.xxx` label, player health anchor, and bottom-center joystick.
- The scenario composes a high-pressure portrait frame with 108 common enemies, two Bosses, 38 XP shards, four summons, twelve Wishcraft loadout entries, and thirteen Wishcraft-hit events spanning lance, beam, scatter, spiral, ricochet, missile, area, melee, summon, shield, pickup, trigger, and burst visual families.
- Added `tests/client/mobile-spectacle-qa-scene.test.ts` to lock portrait aspect ratio, enemy count, Boss count, XP density, summon count, theme count, loadout size, Wishcraft-hit count, visual-family count, and required mobile HUD/joystick selectors.
- Bumped `VISUAL_POLISH_VERSION` to `hd2d-cyberpixel-v34` so mobile screenshot captures rebuild after the late-run portrait evidence pass.

QA artifact:

- `artifacts/visual-polish/qa-mobile-spectacle-scene.png`

QA result:

- This scene is the first dedicated portrait proof point for the full late-run visual stack after the player-readability field: center player, `Lv.xxx`, health bar, top XP/HUD, Boss panel, bottom joystick, horde, XP shards, summons, double Bosses, and dense Wishcraft spectacle all share the same narrow screen.
- This pass is visual/evidence-only. It does not change combat simulation, enemy spawning, enemy behavior, Boss scheduling, damage, cooldowns, XP, score, Wishcraft mechanics, shield behavior, summon behavior, arena phase rules, input feel, or UI persistence.
- Remaining mobile work: capture fresh-run, first-Wishcraft, and active-Boss portrait states, then add short motion clips proving launch, travel, impact, fade, player hit flicker, and Wishcraft install readability under touch-layout constraints.

## Visual Engineering Module Boundaries

Visual work must be split by game-engine responsibility. The codebase should grow like a small 2D game client, not like one page script.

New visual work must preserve these boundaries as an acceptance requirement:

- Add new asset families in focused modules under `src/client/visual/sprites/`, `src/client/visual/wishcraft/`, `src/client/visual/qa/`, or another domain-specific visual directory.
- Keep `src/client/arena.ts`, `src/client/rendering/combat-renderer.ts`, broad entity sprite files, and broad VFX files as orchestration surfaces. They may call focused modules, but they must not become mixed asset catalogs.
- Split before growth becomes hard to review. Any file approaching broad multi-family ownership should move profiles, drawing helpers, or QA scenarios into submodules before more art is added.
- Pair each focused visual module with a focused test that locks budgets, mapping, layer order, or QA coverage without depending on debug UI.

### Runtime Orchestration

Module:

- `src/client/arena.ts`

Owns:

- Player journey state: combat, Wish Break, manifestation, Boss warning/active/victory, death settlement, leaderboard.
- DOM-only UI creation and rendering until those are moved into `src/client/ui/`.
- Input binding and viewport refresh.
- Calls into simulation and rendering modules.

Must not own:

- Sprite factories.
- Pixel drawing primitives.
- Pixi layer/cache synchronization.
- Skill projectile body drawing.
- Art catalogs or animation frame data.

### Simulation And Gameplay Data

Modules:

- `src/client/simulation/combat-loop.ts`
- `src/client/simulation/wishcraft-mechanics.ts`
- `src/client/simulation/boss-encounter.ts`
- `src/client/simulation/enemy-spawning.ts`

Owns:

- Combat facts: positions, health, cooldowns, kills, XP, Boss phase, summons, and feedback events.
- Enemy count and spawn pressure curves.
- Mechanic-side Wishcraft behavior.
- Feedback payloads with only gameplay-safe visual hints such as `origin`, `position`, `visualKind`, `wishcraftId`, and `mechanicId`.

Must not own:

- Pixi graphics objects.
- Colors, shader hints, sprite geometry, animation frame construction, or particle layouts.
- Visual counter-theme assembly beyond data needed by Boss planning.

### Pixi Rendering Runtime

Module:

- `src/client/rendering/combat-renderer.ts`
- `src/client/rendering/feedback-renderer.ts`
- `src/client/rendering/pixi-stage.ts`
- `src/client/rendering/render-cache.ts`
- `src/client/rendering/entity-sync.ts`

Owns:

- Pixi `Application`, stage, layer order, and camera transform.
- Render caches for enemies, Bosses, summons, XP shards, attachments, and screen effects.
- Delegation to feedback rendering for transient hit, launch, projectile, and trail pools.
- Delegation to visual modules for drawing.

Must not own:

- Gameplay rules.
- Wishcraft interpretation.
- Art motif definitions beyond renderer-level cache keys and layer placement.

Current split:

- `src/client/rendering/pixi-stage.ts`: explicit layer order, stage layer creation, camera transform.
- `src/client/rendering/entity-sync.ts`: reusable map-cache synchronization for entities.
- `src/client/rendering/feedback-renderer.ts`: transient hit/projectile/effect lifetime pooling. This split now exists and should remain focused as more VFX pools are added.
- `src/client/rendering/render-cache.ts`: render cache types and constructors.
- New foreground skill-pattern layers must be added explicitly to `pixi-stage.ts` and tested for order; do not hide major skill visuals inside `screenPulseLayer`.
- Theme-specific skill visuals must be represented by data-driven kits under `src/client/visual/wishcraft/`; broad motif groups alone are not enough for the Wishcraft freshness target.

### Visual Asset Modules

Modules:

- `src/client/visual/pixel-primitives.ts`
- `src/client/visual/mech-detail-primitives.ts`
- `src/client/visual/combat-entity-animation.ts`
- `src/client/visual/combat-entity-sprites.ts`
- `src/client/visual/boss-entity-sprites.ts`
- `src/client/visual/runtime-attachments.ts`
- `src/client/visual/runtime-attachment-layout.ts`
- `src/client/visual/combat-feedback-vfx.ts`
- `src/client/visual/sprites/player-mech-state-art.ts`
- `src/client/visual/wishcraft-emitter-sockets.ts`
- `src/client/visual/wishcraft-projectile-vfx.ts`
- `src/client/visual/wishcraft-launch-vfx.ts`
- `src/client/visual/wishcraft-particle-cloud-vfx.ts`
- `src/client/visual/wishcraft-screen-pulse-vfx.ts`
- `src/client/visual/wishcraft-trail-vfx.ts`
- `src/client/visual/wishcraft-evolved-vfx.ts`
- `src/client/visual/wishcraft-vfx-palette.ts`
- `src/client/visual/wishcraft-theme-motifs.ts`
- `src/client/visual/arena-horizon.ts`
- `src/client/visual/visual-assembly.ts`
- `src/client/visual/arena-visual-state.ts`

Owns:

- Code-drawn pixel primitives and motif helpers.
- Reusable sci-fi mechanical detail primitives such as seams, rivets, heat sinks, cable bundles, rails, wing struts, and dragon spines.
- Player, common enemy, summon, and Boss sprite factories.
- Wishcraft attachment rendering on player/enemy/Boss/summon bodies.
- Projectile, beam, impact, death, XP, shield, summon, and screen VFX drawing.
- Theme palette conversion and visual-only phase tinting.
- Theme motif mapping and reusable Wishcraft VFX motif drawing across launches, projectiles, trails, and impacts.
- Evolved-weapon Wishcraft reward motifs through focused `src/client/visual/wishcraft/evolved/` profile and drawing modules.
- Visual assembly from legal Wishcraft visual pieces.

Must not own:

- Damage, cooldowns, targeting, XP, score, Boss reward, or movement rules.
- DOM UI text.
- API calls or SQLite persistence.

### Future Asset Subdirectories

When the visual implementation becomes richer, split `src/client/visual/` further:

- `visual/primitives/`: pixel primitives, glow helpers, geometric motifs.
- `visual/entities/`: player, enemies, bosses, summons, animation frame definitions.
- `visual/wishcraft/`: theme motif kits, projectile bodies, launch emitters, impact residues, persistent trails.
- `visual/arena/`: backgrounds, phase landmarks, transition pulses.
- `visual/ui/`: code-drawn UI ornaments only if DOM/CSS cannot express them cleanly.

This split should happen before any single visual file becomes a broad mixed-purpose file. As a working threshold, a file over roughly 600 lines should either be clearly cohesive or be split before more asset families are added.

## Asset Production Backlog By Module

### `visual/entities/player-mech`

Required assets:

- Base humanoid mech body with helmet, chest core, shoulders, arms, hips, legs, boots, back thrusters, and dark pixel outline.
- Direction-aware thruster frames for idle, north/south/east/west/diagonal movement.
- Base machine-gun launch sockets and muzzle flashes.
- Base laser-sword windup, active slash, and fade frames.
- Wishcraft install snap-on animation for each major attachment slot.

Acceptance:

- The player silhouette remains readable in fresh run, 3+ Wishcraft loadout, Boss fight, and mobile portrait screenshots.
- Movement direction changes exhaust and limb pose without changing movement mechanics.

### `visual/entities/common-enemies`

Required assets:

- Fast Fragile 4-frame harrier hover cycle plus hit flash and breakup fragments.
- Slow Tough 4-frame crawler/blocker locomotion cycle plus armor chip death fragments.
- Swarm Fragile 4-frame tiny drone/bug flutter cycle plus small multi-part breakup.
- Enemy Drift sockets for up to three recent Wishcraft visual pieces.

Acceptance:

- The three common enemy families remain distinguishable in a still screenshot at horde density.
- Recent Wishcraft drift changes enemy appearance without changing enemy mechanics.

### `visual/entities/bosses`

Required assets:

- Flying dragon mech entrance, idle, attack telegraph, hit flash, and death shatter.
- Crawling dragon mech entrance, idle, attack telegraph, hit flash, and death shatter.
- Humanoid dragon mech entrance, idle, attack telegraph, hit flash, and death shatter.
- Rival-theme attachment sockets integrated into wings, claws, reactors, horns, tails, legs, and weapons.

Acceptance:

- Each Boss silhouette is readable without looking at the name.
- Double-Boss encounters keep both Bosses visually distinct under shared screen pressure.

### `visual/wishcraft/projectiles`

Required assets:

- Lance: pointed spear body, tip spark, tail fragments, pierce residue.
- Scatter: fan pellets, staggered impacts, separated trails.
- Beam: charge cap, bright core, translucent shell, start/end caps, pierced-line residue.
- Spiral: corkscrew path fragments, orbiting projectile bodies, radial contact sparks.
- Ricochet: angular trail, bounce node sprites, secondary hit markers.
- Missile: missile body, exhaust plume, arcing contrail, payload explosion.
- Burst: frontal fan, radial burst, retaliation burst pattern marks.

Acceptance:

- At least five attack families are distinguishable from motion and silhouette without reading labels.
- Projectile bodies show launch, travel, impact, and fade as separate visual moments.

### `visual/wishcraft/themes`

Required assets:

- Theme motif kits for all 24 catalog themes.
- Each kit defines attachment motif, projectile motif, trail motif, impact debris, residue, and enemy drift motif.
- At least twelve themes need motif differences beyond color in the first polished pass; the remaining themes must have structured stubs ready to fill.

Acceptance:

- A player wish for fire, ice, gravity, music, dragon, shield, swarm, thunder, neon, meteor, crystal, and clockwork produces visibly different effects beyond palette.
- Boss rival visuals use the same motif vocabulary but opposite theme selection.

### `visual/wishcraft/emitters-and-trails`

Required assets:

- Emitter sockets for shoulder, arm, back, core, aura, orbit, weapon, and summon.
- Launch anticipation flashes tied to the current visual pieces.
- Longer-lived trail/residue pool with budgeted fade, not one-frame rings.
- Screen accent pulses for high-intensity Wishcrafts.

Acceptance:

- The player can see where a Wishcraft attack starts from on the mech or summon.
- Late-run spectacle feels strong while the player health bar, level label, and joystick remain readable.

### `visual/arena`

Required assets:

- Deep Starfield phase landmarks.
- Nebula Rift phase landmarks.
- Ion Graveyard phase landmarks.
- Singularity Gate phase landmarks.
- Double-Boss transition pulse.
- Wishcraft tint overlay constrained by readability budget.

Acceptance:

- The arena visibly changes after each double-Boss milestone.
- Arena phase shifts remain visual-only and do not affect collision, enemy AI, or combat balance.

## Arena And Background Inventory

Arena phases:

- Deep Starfield.
- Nebula Rift.
- Ion Graveyard.
- Singularity Gate.

Required background details:

- Multiple parallax-feeling star densities.
- Large but dim nebula masses.
- Tech grid and distant orbital arcs.
- Phase-specific accent structures.
- Boss/double-boss transition pulse.
- Light Wishcraft tint that does not become a one-color wash.

Current gap:

- Background is denser and more atmospheric than the first version.
- It still lacks large authored phase landmarks and parallax separation.

## UI Visual Requirements

Combat UI should stay utilitarian:

- Top XP bar remains readable and thin.
- Player level above mech, health below mech.
- Boss name/health bar readable during active encounter.
- Wish Break modal polished but must not be mistaken for the visual target of combat art.

No debug UI should be added.

## Implementation Order

1. **Sprite primitive library.** Add reusable pixel-art drawing helpers for outlined polygons, segmented limbs, armor plates, emissive slits, thrusters, fragments, and palette roles.
2. **Player and common enemy sprite pass.** Replace static icon-like enemy bodies and improve player base animation/readability.
3. **Attack VFX pass.** Add projectile/beam/sword launch-origin animation and short-lived trail entities.
4. **Wishcraft visual-piece motif pass.** Make slots choose motif families by theme, not only by slot and palette.
5. **Boss sprite pass.** Integrate visual pieces into boss anatomy and add entrance/idle/hit/death animation.
6. **Arena phase pass.** Add phase landmarks and double-boss transition effects.
7. **Mobile polish pass.** Verify portrait density, joystick overlap, player readability, and effect compression.

## Acceptance Checklist

Before claiming visual completion:

- Capture desktop screenshot at fresh run, first Wishcraft, boss, and late-density states.
- Capture mobile portrait screenshot at fresh run, first Wishcraft, active Boss, and late-density states.
- Compare each screenshot with the visual-reference folder for polish, density, and readability.
- Confirm player silhouette remains readable with 3+ Wishcrafts active.
- Confirm three common enemy families are distinguishable by silhouette in a still screenshot.
- Confirm at least five attack families are distinguishable by animation/VFX.
- Confirm one boss from each silhouette class is distinguishable without reading its name.
- Run `npm test -- --run`, `npm run typecheck`, and `npm run build`.
