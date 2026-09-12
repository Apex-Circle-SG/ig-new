# Analytics

`packages/analytics` defines calculator_view, calculator_started, calculator_completed, calculator_result_shared and related_calculator_clicked. Runtime allowlisting forwards only a known calculator ID and a known interaction label. Numeric income, profile IDs, arbitrary URLs and caller-added fields are dropped, covered by privacy tests.

A provider can be installed through `configureAnalytics`. The current default is no provider: no GA4, cookies, network traffic or analytics persistence. Instrumentation is wired on calculator view, first input, calculation, examples, what-if controls and copying the generic link. Provider failures cannot interrupt a calculation.

Before adding GA4: implement consent management, update privacy/contact/retention, use page paths without private query values, independently inspect browser requests and keep raw inputs out of errors. Search Console is read-only future integration; no credentials or historical metrics were supplied. Page-quality and SEO dashboards must display unavailable metrics rather than zero or fabricated measurements.
