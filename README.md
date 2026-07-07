# Mists of Pandaria Arms Warrior Log Analyzer

To build and run locally, you'll either need [Angular CLI](https://github.com/angular/angular-cli) (built with v14.2.2)
or [Yarn](https://yarnpkg.com/). If you're familiar with ng-cli commands, you can use those.

### Yarn Commands

> `yarn install` - download and install node dependencies
> 
> `yarn serve`   - run locally at http://localhost:4200
> 
> `yarn build`   - build distributable (dist/feral)

### Live Site

Live site not up and running yet.

<!-- ### Configuration Settings

For information on analyzer settings, see [Configuration Settings](SETTINGS.md)

### Glossary

Definitions of stats/terms available via the [Glossary](GLOSSARY.md). -->

### Changelog
- July 7, 2026
  - Completed the port from the feral analyzer: removed druid/priest spells, buffs, and analyses.
  - New Arms analyses: Colossus Smash and Deep Wounds uptime, Mortal Strike / Colossus Smash cast efficiency.
  - Mortal Strike and Colossus Smash tabs; rage shown on casts.
  - Rage cap/waste analysis: average rage, casts made at cap, estimated time rage-capped,
    and estimated wasted rage (rage gains are reconstructed from swings, Mortal Strike,
    and Enrage procs; rage per swing is fitted from the log's rage snapshots).
- September 28, 2025
  - Initial support for Arms!
