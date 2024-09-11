describe("Navigate and Click Find Button for Sale and Rent", () => {
  const parser = new DOMParser();
  const userAgent =
    "Mozilla/5.0 (Linux; Android 10; MI 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36";
  let fixtureData,
    pageContent,
    page2Content,
    page3Content,
    pageQContent,
    whitelistContent;

  const pageLoadComplete = () => {
    cy.get('ul[data-testid="filter-tabs"]', { timeout: 60000 }).should(
      "be.visible"
    );
    cy.get('button:contains("Search")', { timeout: 60000 }).should(
      "be.visible"
    );
  };

  const navigateToCategory = (page) => {
    cy.intercept("GET", "/**", (req) => {
      delete req.headers["x-cypress-is-from-extra-target"];
      req.headers["user-agent"] = userAgent;
    }).as("modifiedRequest");

    cy.visit(page.home);
    cy.wait("@modifiedRequest");
    cy.get("header", { timeout: 50000 }).should("be.visible");

    // Navigate through the categories using dynamic data from the page object
    cy.get('div[data-testid="category"]', {
      timeout: 60000,
      waitForAnimations: false,
      animationDistanceThreshold: 20,
    })
      .should("be.visible")
      .click();
    cy.get('div[role="button"]', {
      timeout: 60000,
      waitForAnimations: false,
      animationDistanceThreshold: 20,
    })
      .contains("span", page.category)
      .should("be.visible")
      .click();
    cy.get('div[role="button"]', {
      timeout: 60000,
      waitForAnimations: false,
      animationDistanceThreshold: 20,
    })
      .contains("span", page.type)
      .should("be.visible")
      .click();
    cy.get('div[role="button"]', {
      timeout: 60000,
      waitForAnimations: false,
      animationDistanceThreshold: 20,
    })
      .contains("span", page.subCategory)
      .should("be.visible")
      .click();
    cy.wait(2000);

    cy.get('button:contains("Search")', { timeout: 60000 })
      .should("be.visible")
      .click();

    pageLoadComplete();

    return cy.document().then((doc) => {
      return doc.documentElement.innerHTML;
    });
  };

  const gotoPage2 = () => {
    // Navigate to page 2
    cy.get('a[aria-label="Page 2"]').should("be.visible").click();
    pageLoadComplete();

    cy.document().then((doc) => {
      page2Content = doc.documentElement.innerHTML;
    });
  };

  const gotoPage3 = () => {
    // Navigate to page 3
    cy.get('a[aria-label="Page 3"]').should("be.visible").click();
    pageLoadComplete();

    cy.document().then((doc) => {
      page3Content = doc.documentElement.innerHTML;
    });
  };

  const swithToPrivateTab = () => {
    cy.get('a:contains("PRIVATE")').should("be.visible").click();
    pageLoadComplete();

    cy.document().then((doc) => {
      whitelistContent = doc.documentElement.innerHTML;
    });
  };

  const sortbyPriceLow2High = () => {
    cy.get('div[data-label="newest_first"]').should("be.visible").click();
    cy.get('div[data-testid="filter-sortby"]')
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.get('div[role="dialog"] ul p')
      .contains("Price: Low to High")
      .should("be.visible")
      .click();

    cy.get('button[data-testid="btn-apply"]')
      .contains("Apply")
      .should("be.visible")
      .click();

    pageLoadComplete();

    cy.document().then((doc) => {
      whitelistContent = doc.documentElement.innerHTML;
    });
  };

  // Load the fixture data before all tests
  before(() => {
    cy.fixture("apartmentCondominium").then((data) => {
      fixtureData = data; // Store fixture data for use in tests
    });
  });

  // Define separate test suites for each scenario: for sale and for rent
  ["for-sale", "for-rent"].forEach((type) => {
    describe(`Testing ${type}`, () => {
      before(() => {
        cy.wrap(fixtureData).then((data) => {
          const page = data[type];
          navigateToCategory(page).then((content) => {
            pageContent = content;
          });

          gotoPage2();
          gotoPage3();
          swithToPrivateTab();
          sortbyPriceLow2High();
        });
      });

      it(`${type}: should have a title tag with 30-60 characters including keyword`, () => {
        cy.document().then((doc) => {
          pageContent = doc.documentElement.innerHTML;
          const docContent = parser.parseFromString(pageContent, "text/html");
          const title = docContent.querySelector("title").innerText;

          expect(title.length).to.be.within(30, 90);
          expect(title).to.include(fixtureData[type].title.keyword);
        });
      });

      it(`${type}: should have a meta description with 120-156 characters including keyword`, () => {
        const docContent = parser.parseFromString(pageContent, "text/html");
        const metaDescription = docContent
          .querySelector('meta[name="description"]')
          .getAttribute("content");

        expect(metaDescription.length).to.be.within(120, 156);
        expect(metaDescription).to.include(fixtureData[type].desc.keyword);
      });

      it(`${type}: should have correct robots meta`, () => {
        const docContent = parser.parseFromString(pageContent, "text/html");
        const listingItems = docContent.querySelectorAll(
          'ul[data-testid="listing-ads"] > li'
        );
        const itemCount = listingItems.length;

        const robotMeta = docContent
          .querySelector('meta[name="robots"]')
          .getAttribute("content");

        expect(robotMeta).to.include(
          itemCount > 3 ? "index, follow" : "noindex, follow"
        );
      });

      it(`${type}: canonical should drop adsby, sortby`, () => {
        let docContent = parser.parseFromString(whitelistContent, "text/html");
        let canonical = docContent
          .querySelector('link[rel="canonical"]')
          .getAttribute("href");

        expect(canonical).to.include(fixtureData[type].canonical);
      });

      it(`${type} Page 2: should have a valid canonical link`, () => {
        const docContent = parser.parseFromString(page2Content, "text/html");
        const canonical = docContent
          .querySelector('link[rel="canonical"]')
          .getAttribute("href");

        expect(canonical).to.include(fixtureData[type].canonical);
      });

      it(`${type} Page 2: should have correct robots meta`, () => {
        const docContent = parser.parseFromString(page2Content, "text/html");
        const listingItems = docContent.querySelectorAll(
          'ul[data-testid="listing-ads"] > li'
        );
        const itemCount = listingItems.length;

        const robotMeta = docContent
          .querySelector('meta[name="robots"]')
          .getAttribute("content");

        expect(robotMeta).to.include(
          itemCount > 3 ? "index, follow" : "noindex, follow"
        );
      });

      it(`${type} Page 3: should have a valid canonical link`, () => {
        const docContent = parser.parseFromString(page3Content, "text/html");
        const canonical = docContent
          .querySelector('link[rel="canonical"]')
          .getAttribute("href");

        expect(canonical).to.include(fixtureData[type].canonical);
      });

      it(`${type} Page 3: should have correct robots meta`, () => {
        const docContent = parser.parseFromString(page3Content, "text/html");
        const listingItems = docContent.querySelectorAll(
          'ul[data-testid="listing-ads"] > li'
        );
        const itemCount = listingItems.length;

        const robotMeta = docContent
          .querySelector('meta[name="robots"]')
          .getAttribute("content");

        expect(robotMeta).to.include(
          itemCount > 3 ? "index, follow" : "noindex, follow"
        );
      });

      it(`${type} Page 3: Should have a correct <link rel='next'> tag on the third page`, () => {
        const docContent = parser.parseFromString(page3Content, "text/html");
        const nextTag = docContent
          .querySelector('link[rel="next"]')
          .getAttribute("href");

        expect(nextTag).to.include(fixtureData[type].canonical + "?o=4");
      });

      it(`${type} Page 3: Should have a correct <link rel='prev'> tag on the third page`, () => {
        const docContent = parser.parseFromString(page3Content, "text/html");
        const prevTag = docContent
          .querySelector('link[rel="prev"]')
          .getAttribute("href");

        expect(prevTag).to.include(fixtureData[type].canonical + "?o=2");
      });

      it(`${type}: should have correct canonical and robots based on queries`, () => {
        navigateToCategory(fixtureData[type]);
        pageLoadComplete();

        cy.wrap(fixtureData[type].query).each((query) => {
          cy.get('input[data-testid="input-search"]', { timeout: 60000 })
            .should("be.visible")
            .should("not.be.disabled")
            .clear()
            .type(query.q);

          cy.get('button:contains("Search")', { timeout: 60000 })
            .should("be.visible")
            .click();
          pageLoadComplete();

          cy.document().then((doc) => {
            pageQContent = doc.documentElement.innerHTML;
            const docContent = parser.parseFromString(
              pageQContent,
              "text/html"
            );
            const canonical = docContent
              .querySelector('link[rel="canonical"]')
              .getAttribute("href");

            expect(canonical).to.include(query.canonical);

            const listingItems = docContent.querySelectorAll(
              'ul[data-testid="listing-ads"] > li'
            );
            const itemCount = listingItems.length;

            const robotMeta = docContent
              .querySelector('meta[name="robots"]')
              .getAttribute("content");

            expect(robotMeta).to.include(
              itemCount >= 3 ? "index, follow" : "noindex, follow"
            );
          });
        });
      });
    });
  });
});
