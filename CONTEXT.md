# 无限星愿 / Infinite Starwish

This context defines the domain language for 无限星愿 / Infinite Starwish, a space pixel-art survivor-like roguelite where player wishes are interpreted into in-game abilities.

## Language

**Wish**:
A player's free-form statement of the power fantasy they want next. A wish expresses intent, theme, style, or desired behavior without needing to use game-system terminology.
_Avoid_: Prompt, request, upgrade text

**Wish Interpreter**:
A domain role that translates a player's free-form wish into legal in-game ability outcomes. It preserves the fantasy of the wish while remaining bounded by the game's balance, content vocabulary, and safety rules, and it should produce the closest valid fulfillment rather than exposing ordinary mismatch as failure.
_Avoid_: LLM randomizer, content generator

**Wish Break**:
A paused upgrade moment where the player enters a wish and receives a new wishcraft. Combat, enemies, projectiles, and pickups are frozen during a wish break.
_Avoid_: Upgrade choice, level-up menu

**Player Pause**:
A player-initiated interruption of combat. Player pause does not grant wishcraft, call the wish interpreter, or end the run.
_Avoid_: Wish break, game over

**Wish Fulfillment**:
The waiting state after a wish is submitted and before a wishcraft is awarded. Wish fulfillment should preserve the player's sense that the wish is being answered, even when invalid interpreter output must be repaired or replaced with a fallback, and technical repair attempts are not shown to the player.
_Avoid_: Loading spinner, API call

**Wishcraft Manifestation**:
The short visual payoff when a wishcraft is awarded. Wishcraft manifestation makes the new power feel installed or awakened before combat resumes.
_Avoid_: Generic level-up flash, reward toast

**Wishcraft**:
An equipable ability combination produced from a wish. Each wish break awards one wishcraft with one primary mechanic, one primary theme, and any budgeted supporting pieces, and initial wishcrafts avoid negative tradeoffs or punishment mechanics.
_Avoid_: Buff, weapon config, skill

**Wishcraft Contract**:
The shared definition of what makes a wishcraft valid and usable. A wishcraft contract lets interpretation, combat, and presentation agree on legal pieces and parameters without giving the client the role of interpreting wishes, and it should legalize creative outcomes without erasing their fantasy when possible.
_Avoid_: API response shape, frontend validation

**Wishcraft Budget**:
The power and presentation allowance available for a wishcraft at a given point in level progression. A wishcraft budget is driven by progression rather than by how strongly a wish is worded, presentation allowance may grow faster than mechanical power, and visual limits are separate from mechanic limits.
_Avoid_: Prompt strength, rarity roll

**Mechanic Piece**:
A legal gameplay fragment that can be composed into a wishcraft and affects combat behavior or balance. Mechanic pieces define what a wishcraft does, not how it looks, operate automatically or through conditions rather than player-pressed ability buttons, and do not change the game's fixed targeting rules.
_Avoid_: Visual effect, particle theme

**Mechanic Archetype**:
A broad, balanceable pattern of direct combat behavior such as projectile, melee, area burst, summon, shield, stat support, trigger, pickup, or burst. Mechanic archetypes keep gameplay legible while pieces and parameters provide variation, and the initial design favors direct damage over RPG-like status systems.
_Avoid_: Unique skill, generated mechanic

**Health Progression**:
The player's maximum health growth and fixed recovery through level progression and boss victories. Maximum health is not changed by wishcrafts, initial wishcrafts do not heal the player, leveling restores a small amount of health, boss victory restores health fully, and these fixed recovery moments do not affect shields.
_Avoid_: Wish-granted max health, health build

**Persistent Combat Entity**:
A combat-affecting entity that remains active beyond a brief attack moment. The initial design allows persistent combat entities only as player-following summons, not as mines, traps, turrets, or lingering hazards.
_Avoid_: Mine, trap, placed turret, lingering hazard

**Enemy Status Effect**:
A gameplay alteration applied to enemies after they are hit, such as slow, freeze, fear, charm, pull, or debuff. The initial design avoids enemy status effects so enemy behavior stays simple and visual themes do not become hidden mechanics.
_Avoid_: Elemental debuff, crowd control state

**Visual Piece**:
A legal presentation fragment that can be composed into a wishcraft and affects appearance, animation, or effects. Visual pieces define how a wishcraft looks, not what it does mechanically.
_Avoid_: Stat modifier, hidden mechanic

**Theme Tag**:
A semantic label used to connect wishes, visual pieces, mechanic pieces, rival themes, enemy drift, and arena tinting. A theme tag carries fantasy meaning but does not create hidden gameplay behavior by itself.
_Avoid_: Damage type, element rule

**Composition Depth**:
The expressive range created by combining a bounded catalog of mechanic pieces, visual pieces, themes, and safe parameters. Composition depth is about meaningful variety from reusable parts rather than hand-authoring every possible outcome, and the initial content set must already be broad enough to make wishes feel varied.
_Avoid_: Infinite generation, bespoke ability count

**Wishcraft Loadout**:
The accumulated set of wishcrafts a player has gained during a run. A wishcraft loadout grows by adding new wishcrafts rather than rewriting earlier ones, and the initial design does not impose a hard count limit.
_Avoid_: Build, equipment list, skill tree

**Loadout Summary**:
A compact description of the player's current wishcraft loadout used to guide future wish interpretation. A loadout summary helps avoid stale repetition without allowing earlier wishcrafts to be rewritten.
_Avoid_: Run log, full build state

**Visual Assembly**:
A shared visual language for composing players, bosses, and enemies from recognizable parts, effects, and themes. Visual assembly expresses fantasy and origin rather than exact mechanics, uses shared attachment semantics mapped per entity role, and scales by role: bosses are the most elaborate, the player is expressive but readable, and common enemies stay small enough to support horde combat.
_Avoid_: Cosmetic skin, static sprite upgrade

**Player Mech**:
The player's readable humanoid mech silhouette. Visual assembly may add equipment, effects, and orbiting elements to the player mech, but the core humanoid identity remains stable.
_Avoid_: Shapeshifted avatar, replaced player form

**Boss Mech Silhouette**:
A boss baseline body plan selected from a small set such as flying, crawling, or humanoid mech forms. Rival themes and visual assembly elaborate the chosen boss mech silhouette rather than replacing it with unrelated boss bodies.
_Avoid_: Generic boss body, shapeless boss

**Neon Pixel Space**:
The game's visual direction: readable pixel-art characters and weapons enhanced by high-contrast neon accents, shader-driven particles, glow, trails, and space-cyberpunk atmosphere. HD-2D is a texture and presentation reference here, not a commitment to 3D scenes.
_Avoid_: 3D scene, imported illustration, low-fi placeholder art

**Visual Acceptance Reference**:
Local screenshots used only to calibrate visual polish, horde density, combat readability, projectile saturation, and late-run screen energy during acceptance review. The Vampire Survivors screenshots under `docs/visual-reference/vampire-survivors/` are polish references, not style references, asset sources, color-picking sources, or permission to import runtime art.
_Avoid_: Style target, asset reference, copied composition

**Code-Drawn Art**:
The project's art production rule that visual assets, including gameplay entities, effects, backgrounds, and UI, are created through code, procedural generation, or shaders. Code-drawn art excludes AI-generated images and imported external image assets from the core game.
_Avoid_: AIGC asset, imported sprite sheet, stock UI image

**Arena Phase**:
The arena's visual state during a run. Arena phases advance after double boss encounters, changing the background atmosphere through a preset sequence with light wishcraft-influenced tinting, without changing the arena into a different map or altering gameplay rules.
_Avoid_: Stage, biome, level

**Enemy Drift**:
The way common enemies visually shift in response to the player's recent wishcrafts. Enemy drift is led by the latest wishcraft and lightly influenced by a small recent window rather than the full wishcraft loadout.
_Avoid_: Enemy evolution, adaptive difficulty

**Common Enemy**:
A horde enemy whose main threat is contact pressure. Common enemies stay visually small and mechanically simple so large groups remain readable and satisfying to clear; the initial set uses a few contact-pressure templates rather than ranged enemies.
_Avoid_: Minion, mob, creep

**Boss Encounter**:
A major enemy encounter triggered at progression milestones. A boss encounter visually answers the player's current wishcraft loadout, including the wishcraft gained at that milestone, without mechanically punishing the player's choices; the encounter cadence repeats as single, single, double, double encounters use complementary rival themes, pauses new level-up wish breaks while active, and boss victory rewards progression through XP shards rather than granting wishcraft directly.
_Avoid_: Wave boss, stage boss

**Boss Name**:
A player-visible name for a boss generated from local templates and rival themes. Boss names identify major encounters without expanding the wish interpreter's responsibilities.
_Avoid_: LLM boss copy, enemy label

**Boss Template**:
A reusable pattern for boss combat behavior. Boss templates provide mechanical variety without reading the player's wishcraft loadout, declare compatible boss mech silhouettes, and leave rival themes to provide the visual and fantasy contrast to that loadout.
_Avoid_: Generated boss mechanic, counter-build

**Boss Pressure**:
The combat pressure pattern used while a boss encounter is active. Boss pressure keeps common enemies present without letting them bury the boss's readability or visual presence.
_Avoid_: Boss room, normal spawn mode

**Rival Theme**:
A boss theme chosen as a visual or fantasy contrast to the player's wishcraft loadout. A rival theme creates the feeling of an opposing force without acting as a direct mechanical counter.
_Avoid_: Counter-pick, hard counter, weakness check

**Wishcraft Name**:
A short player-visible name for a wishcraft, improvised from the player's wish in each supported language. A wishcraft name echoes the wish fantasy, remains cosmetic, and does not define or promise gameplay behavior.
_Avoid_: UI copy, translated ability description

**Base Kit**:
The player's fixed starting combat package. The base kit provides the minimum combat loop before any wishcraft is gained, combines ranged automatic fire against nearby valid ranged targets with close automatic melee against nearby threats, and is not part of the wishcraft loadout.
_Avoid_: Starting wishcraft, default upgrade

**Movement Vector**:
The player's intended movement direction and strength during combat. A movement vector may come from touch, mouse, or keyboard input without changing the game rules, movement is the player's only direct combat input, and wishcrafts do not change the player's movement feel.
_Avoid_: Joystick state, keyboard movement

**Arena**:
The bounded combat space where a run takes place. The arena is larger than the visible screen, keeps enemy pressure, pickups, boss presence, and player movement within a controlled play area, and its boundary stops movement rather than wrapping or damaging the player.
_Avoid_: Infinite map, stage, level

**XP Shard**:
A collectible dropped from defeated enemies that feeds level progression. XP shards may merge without changing total XP, are drawn toward the player once the player enters their pickup range, and are not blocked by enemies or arena space.
_Avoid_: Experience points, loot orb

**Level Progression**:
The player's advancement through a run by collecting XP shards. Level progression uses stable thresholds, each level gained creates a wish break, and faster late-run leveling should come primarily from combat density and player power growth rather than large XP value inflation.
_Avoid_: Dynamic wish scaling, wave reward

**Intensity Step**:
An increase in enemy pressure after a boss encounter. Intensity steps make the run feel denser and faster as progression milestones are cleared, mainly by increasing enemy presence.
_Avoid_: Wave, stage transition

**Player Name**:
A short display name submitted when a run ends to attribute a leaderboard score. A player name is not an account, identity, or save profile.
_Avoid_: Username, account name, profile

**Run**:
A single-player play session from starting combat until the player's mech is destroyed. A run is the unit that produces a score and a wishcraft history, and only destruction creates a leaderboard-eligible result.
_Avoid_: Match, save, campaign

**Score**:
A leaderboard value that measures combat performance during a run. Score reflects active combat time, kills, boss victories, and progression rather than the wording or names of wishes.
_Avoid_: Rank points, wish quality

**Leaderboard Entry**:
A submitted player name's best recorded score. A leaderboard entry may reveal the wishcraft names from the scoring run as cosmetic run history, and a repeated player name keeps only its highest-scoring run.
_Avoid_: Player account, save profile, match history

**Leaderboard**:
The global ranking of leaderboard entries shared by single-player runs. The initial leaderboard presents the top twenty entries.
_Avoid_: Local scores, session scores, profile list

**Wish Fidelity**:
The degree to which a wishcraft feels like it satisfies the player's wish. Wish fidelity is primarily visual, secondarily behavioral, and not a measure of raw power; the freshness of custom visual expression is central to the game's fun.
_Avoid_: Balance strength, prompt accuracy

**Creative Latitude**:
The room the wish interpreter has to choose expressive legal combinations, names, themes, and safe parameters within the wishcraft contract. Creative latitude favors fun, surprise, and wish fidelity over deterministic optimization while staying inside legality and runtime limits.
_Avoid_: Deterministic mapping, balance-first interpretation

**Fallback Wishcraft**:
A valid wishcraft awarded when normal wish interpretation cannot complete. A fallback wishcraft should preserve the wish's apparent theme when possible before falling back to random legal choices.
_Avoid_: Error reward, default upgrade

**Wish Interpretation Trace**:
A record of how a wish became a wishcraft. Wish interpretation traces exist to tune fidelity, variety, validation, repair, and fallback behavior.
_Avoid_: Chat transcript, analytics event
