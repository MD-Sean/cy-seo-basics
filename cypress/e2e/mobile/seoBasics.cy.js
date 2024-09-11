describe("Test with multiple fixtures", () => {
  // const fixtures = ["homepage", "listingpage"];
  const fixtures = ["listingpage"];
  // const fixtures = ["homepage"];

  let page;
  const userAgent =
    "Mozilla/5.0 (Linux; Android 10; MI 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36";

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
              delete req.headers["x-cypress-is-from-extra-target"];
              req.headers["user-agent"] = userAgent;
            }).as("modifiedRequest");

            cy.visit(page.url);
            cy.wait("@modifiedRequest");
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
            expect(text.length).to.be.within(30, 60);
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

      it(`${fixture} should have valid Merchant Listing structured data`, () => {
        cy.get('script[type="application/ld+json"]').then(($scripts) => {
          const found = Array.from($scripts).some(($script) => {
            const json = JSON.parse($script.innerText);

            if (json["@type"] === "Product") {
              expect(json).to.have.property("name").and.to.be.a("string");
              expect(json).to.have.property("image").and.to.be.a("string");
              expect(json)
                .to.have.property("description")
                .and.to.be.a("string");
              expect(json).to.have.property("sku").and.to.be.a("string");

              // Validate 'brand' object if it exists
              if (json.brand) {
                expect(json.brand).to.have.property("@type", "Brand");
                expect(json.brand)
                  .to.have.property("name")
                  .and.to.be.a("string");
              }

              // Validate 'review' object if it exists and ensure it's an array of reviews
              if (json.review) {
                expect(json.review).to.be.an("array").and.not.to.be.empty;
                json.review.forEach((review) => {
                  expect(review).to.have.property("@type", "Review");
                  expect(review)
                    .to.have.property("reviewRating")
                    .and.to.be.an("object");
                  expect(review.reviewRating).to.have.property(
                    "@type",
                    "Rating"
                  );
                  expect(review.reviewRating)
                    .to.have.property("ratingValue")
                    .and.to.be.a("string");
                });
              }

              // Validate 'offers' object within the Product type
              expect(json).to.have.property("offers").and.to.be.an("object");
              expect(json.offers)
                .to.have.property("price")
                .and.to.be.a("string");
              expect(json.offers)
                .to.have.property("priceCurrency")
                .and.to.be.a("string");
              expect(json.offers)
                .to.have.property("availability")
                .and.to.be.a("string");

              // All checks passed
              return true;
            }

            // Return false if this script does not match the required structured data
            return false;
          });

          // Fail the test if no valid Merchant Listing structured data was found
          expect(found).to.be.true;
        });
      });
    });
  });
});
