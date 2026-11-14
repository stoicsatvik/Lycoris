#!/usr/bin/perl
# Builds index.html from an untouched snapshot of the live Lycoris page.
# It adds the theme stylesheet, swaps the typefaces, and adds homepage navigation, an index strip,
# moon labels, corner brackets and a motion switch. Everything else is left as served.
# Usage: perl build.pl snapshot.html > index.html
use strict; use warnings;
local $/; my $h = <>;
my $ATLAS = "https://anonymoussouss-max.github.io/Mars-Atlas/";
my $n = 0;
sub must { my ($ok, $what) = @_; die "build.pl: could not apply '$what' (has the live page changed?)\n" unless $ok; $n++; }

# Typefaces: IBM Plex for text and labels (the same family as the Mars Atlas pages this site links to).
must($h =~ s{family=DM\+Mono:wght\@400;500&family=Space\+Grotesk:wght\@400;500;600;700}{family=IBM+Plex+Mono:wght\@400;500&family=IBM+Plex+Sans:wght\@400;500;600}, "font import");
must($h =~ s{'?DM Mono'?}{'IBM Plex Mono'}g, "mono family");
must($h =~ s{'Space Grotesk'}{'IBM Plex Sans'}g, "sans family");

must($h =~ s{</head>}{<link rel="stylesheet" href="theme-kaguya.css"></head>}, "theme link");

# Navigation: the dead SIMULATE button and the status text make way for real links.
must($h =~ s{<button>SIMULATE</button></nav><div class="state">SCENARIO WORKSPACE</div>}{<a href="${ATLAS}#/journey">HELMET HUD</a><a href="${ATLAS}#/calc">RESEARCH</a></nav><div class="top-right"><button type="button" id="motion" class="motion" aria-pressed="true">MOTION ON</button><a class="claire-btn" href="${ATLAS}#/claire-gate">EXPERIMENTAL CLAIRE</a></div>}, "nav");

# Headline: the last two words set in italic.
must($h =~ s{<h1>Every journey begins with a better plan\.</h1>}{<h1>Every journey begins with a <em>better plan.</em></h1>}, "headline");

# Headline block: helmet preview link and the project note. A coordinates line runs down the left edge.
must($h =~ s{(<a class="source" href="https://trek.nasa.gov/mars/"[^>]*>[^<]*</a>)}{<a class="hud-link" href="${ATLAS}#/journey">Preview helmet HUD</a>$1}, "hero links");
must($h =~ s{(<section class="copy">)}{<div class="edge-note" aria-hidden="true">18.44° N · 77.45° E · JEZERO · ISIDIS RIM</div>$1}, "edge note");

# Globe: corner brackets, the two moons on their orbits, and a zoom button that opens the map.
must($h =~ s{(<canvas id="mars">\s*</canvas>)}{$1<span class="bracket tl"></span><span class="bracket tr"></span><span class="bracket bl"></span><span class="bracket br"></span><span class="moon phobos"><i></i>PHOBOS</span><span class="moon deimos"><i></i>DEIMOS</span><button type="button" class="zoom-in" aria-label="Zoom in to the mission map" onclick="document.getElementById('open-map').click()">+</button>}, "globe extras");

# A numbered index strip along the bottom of the homepage.
my $cards = qq{<nav class="home-index" aria-label="Features">}
  . qq{<a href="${ATLAS}#/craters"><span class="no">01</span><span><b>Plan a traverse</b><em>Compare crossing and detour routes.</em></span><i aria-hidden="true">→</i></a>}
  . qq{<a href="${ATLAS}#/journey"><span class="no">02</span><span><b>Helmet HUD</b><em>Follow the journey, instrument by instrument.</em></span><i aria-hidden="true">→</i></a>}
  . qq{<a class="claire" href="${ATLAS}#/claire-gate"><span class="no">03</span><span><b>Experimental Claire <u>Unvalidated</u></b><em>Explore the temperature–radiation hypothesis.</em></span><i aria-hidden="true">→</i></a>}
  . qq{</nav>};
must($h =~ s{(<div class="provenance">.*?</div>)</main>}{$1$cards</main>}s, "index strip");

# Motion switch: the globe's spin obeys it, and it starts off for people who ask for reduced motion.
must($h =~ s{sphere\.rotation\.y\+=opening\?\.0018:\.00072;}{sphere.rotation.y+=(window.__lycMotion===false?0:1)*(opening?.0018:.00072);}, "rotation hook");
my $js = q{<script>(()=>{const b=document.getElementById("motion");if(!b)return;const set=on=>{window.__lycMotion=on;b.setAttribute("aria-pressed",String(on));b.textContent=on?"MOTION ON":"MOTION OFF"};set(!matchMedia("(prefers-reduced-motion: reduce)").matches);b.addEventListener("click",()=>set(window.__lycMotion===false))})()</script>};
must($h =~ s{</body>}{$js</body>}, "motion script");

print $h;
print STDERR "build.pl: applied $n changes\n";
