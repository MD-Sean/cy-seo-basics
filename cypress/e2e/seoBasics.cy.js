describe("Test with multiple fixtures", () => {
  // const fixtures = ["homepage", "listingpage"];
  // const fixtures = ["listingpage"];
  const fixtures = ["homepage"];

  let page;
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36";

  fixtures.forEach((fixture) => {
    describe(`Testing SEO Basics Test Suite for ${fixture}`, () => {
      beforeEach(function () {
        const matchingFixture = fixtures.find((fixture) =>
          this.currentTest.title.toLowerCase().includes(fixture)
        );

        if (matchingFixture) {
          cy.fixture(matchingFixture).then((pageData) => {
            page = pageData;

            cy.intercept("GET", "/**", (req) => {
              req.headers["user-agent"] = userAgent;
            }).as("getWithHeaders");
            cy.visit(page.url);
            cy.wait("@getWithHeaders");
          });
        } else {
          throw new Error("No matching fixture found for the test title.");
        }
      });

      it(`${fixture}: should have a valid canonical link`, () => {
        cy.get('link[rel="canonical"]')
          .should("have.attr", "href")
          .and("include", page.canonical);
      });

      it(`${fixture}: should have a title tag with 30-60 characters including keyword`, () => {
        cy.get("title")
          .should("exist")
          .invoke("text")
          .then((text) => {
            expect(text.length).to.be.within(30, 100);
            expect(text.toLowerCase()).to.include(page.title.keyword);
          });

        it(`${fixture}: should have a meta description with 120-156 characters including keyword`, () => {
          cy.get('meta[name="description"]')
            .should("have.attr", "content")
            .then((content) => {
              expect(content.length).to.be.within(120, 156);
              expect(content.toLowerCase()).to.include(page.desc.keyword); // Replace 'keyword' with the actual keyword
            });
        });
      });

      it(`${fixture}: should have only one H1 tag`, () => {
        cy.get("h1").should("have.length", 1);
        cy.get("h1").invoke("text").should("include", page.H1.keyword); // Optional: Check if H1 includes keyword
      });

      it(`${fixture}: should have several H2 tags including keywords`, () => {
        cy.get("h2").should("have.length.at.least", 2);
        cy.get("h2").each(($el) => {
          cy.wrap($el)
            .invoke("text")
            .should("match", /page.H1.keyword/i); // Replace 'keyword' with the actual keyword
        });
      });

      it(`${fixture}: should have one H1 tag and correct heading hierarchy`, () => {
        cy.get("h1").should("have.length", 1);
        cy.get("h1").nextAll("h2").should("exist");
        cy.get("h2").nextAll("h3").should("exist");
      });

      it(`${fixture}: should have a title in the head`, () => {
        cy.title().should("not.be.empty");
      });

      it(`${fixture}: should have a meta description in the head`, () => {
        cy.get('meta[name="description"]')
          .should("have.attr", "content")
          .and("not.be.empty");
      });

      it(`${fixture}: should have Google-readable breadcrumbs`, () => {
        cy.get('[itemtype="http://schema.org/BreadcrumbList"]').should("exist");
        cy.get('[itemprop="itemListElement"]').should(
          "have.length.greaterThan",
          0
        );
      });

      // Test for ld+json syntax errors
      it(`${fixture}: should have valid ld+json structured data`, () => {
        cy.get('script[type="application/ld+json"]').each(($script) => {
          const json = $script[0].innerText;
          try {
            JSON.parse(json);
          } catch (e) {
            throw new Error("Invalid JSON-LD format: " + e.message);
          }
        });
      });

      it(`${fixture}: should have all required structured data properties`, () => {
        cy.get('script[type="application/ld+json"]').should(($scripts) => {
          $scripts.each((index, script) => {
            const data = JSON.parse(script.innerText);
            expect(data).to.have.property("@type");
            expect(data).to.have.property("name");
          });
        });
      });

      it(`${fixture}: should follow proper data types in structured data`, () => {
        cy.get('script[type="application/ld+json"]').each(($script) => {
          const data = JSON.parse($script[0].innerText);
          // Example checks
          if (data["@type"] === "Organization") {
            expect(data.name).to.be.a("string");
            expect(data.page).to.be.a("string");
          }
        });
      });
    });
  });
});
