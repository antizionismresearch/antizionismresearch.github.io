import React from "react";
import "../../styles/stylesheet.css";

export default function About() {
  return (
    <main className="main p-6">
      <section className="short-text space-y-8">
        <div>
          <h1 className="claim-short">About The Antizionism Research Project</h1>

          <p className="claim-full">
            The Antizionism Research Project is an independent research and documentation project
            focused on recurring antizionist narratives, rhetorical patterns,
            and antisemitic discourse in online public conversation.
          </p>

          <p className="claim-full">
            The project is built as a searchable database. Its goal is to organize examples of public discourse
            into a structured taxonomy so that readers, researchers, educators,
            journalists, and Jewish community organizations can better
            understand how antizionist arguments appear, evolve, repeat, and
            overlap across digital media.
          </p>
        </div>

        <div>
          <h2 className="claim-short">Purpose</h2>

          <p className="claim-full">
            Contemporary antizionist discourse often appears through recurring libels,
            claims, slogans, accusations, analogies, and moral frameworks. Dor
            Hadash is intended to document those patterns in a form that is
            searchable, categorizable, and usable for education, research,
            media literacy, and public understanding.
          </p>

          <p className="claim-full">
            The project's focus is on public rhetoric, narrative
            structure, ideological framing, and the ways antizionist discourse
            can normalize hostility, hate, and violence toward Israel, Zionism, Jews, or Jewish
            collective identity.
          </p>
        </div>

        <div>
          <h2 className="claim-short">What the Database Tracks</h2>

          <p className="claim-full">
            The Antizionism Research Project organizes public examples into claims and categories.
            These may include recurring accusations about Zionism, comparisons
            between Israel and other historical or political systems, arguments
            about Jewish identity and peoplehood, reactions to antisemitism,
            selective standards applied to Israel, or rhetoric that appears in
            activist, media, academic, or social media environments.
          </p>

          <p className="claim-full">
            The database is designed to show not only isolated examples, but
            patterns: which claims recur, how they are phrased, how they relate
            to one another, and how they appear over time.
          </p>
        </div>

        <div>
          <h2 className="claim-short">Methodology</h2>

          <p className="claim-full">
            Entries are based on publicly available statements, posts, media,
            or other public-facing material. Examples are manually reviewed and
            categorized according to the claim or rhetorical pattern they appear
            to represent.
          </p>

          <p className="claim-full">
            Categories are developed iteratively. As new examples are added,
            the taxonomy may be refined, expanded, consolidated, or reorganized
            to better reflect recurring patterns in the data.
          </p>

          <p className="claim-full">
            Where possible, examples are preserved with dates, source links,
            surrounding context, and descriptive notes so users can evaluate the
            material directly.
          </p>
        </div>

        <div>
          <h2 className="claim-short">Intended Audience</h2>

          <p className="claim-full">
            The Antizionism Research Project is intended for people who need a clearer way to study
            and explain antizionist discourse, including Jewish educators,
            students, researchers, journalists, campus advocates, community
            organizations, and members of the public trying to understand how
            these narratives function online.
          </p>
        </div>

        <div>
          <h2 className="claim-short">Research Goals</h2>

          <p className="claim-full">
            The long-term goal is to build a research platform
            for documenting antizionist rhetoric and related antisemitic
            narratives.
          </p>

          <p className="claim-description">
            The Antizionism Research Project is an independent project in active development. The
            database, taxonomy, interface, and methodology are expected to
            evolve as the project grows.
          </p>
        </div>
      </section>
    </main>
  );
}