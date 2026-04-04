---
name: UX4G Antigravity UI/UX Design System Skill
description: Design, build, and critique production-grade, accessible, Government of India–compliant UI/UX using the UX4G Design System.
---
# SKILL.md — UX4G Antigravity UI/UX Design System Skill
**Version:** 1.0 | **Based on:** UX4G v2.0.8 (Government of India Design System)
**Source Docs:** https://doc.ux4g.gov.in | Powered by NeGD | MeitY

---

## WHAT THIS SKILL IS

This skill enables Claude to design, build, and critique **production-grade, accessible, Government of India–compliant UI/UX** using the **UX4G Design System** — the official design system by the National e-Governance Division (NeGD), Ministry of Electronics & Information Technology (MeitY).

When a user asks Claude to:
- Build a government portal, dashboard, or citizen-facing web page
- Create UX4G-compliant components, layouts, or forms
- Design accessible interfaces following WCAG / GIGW / IS 17802 standards
- Write HTML/CSS/JS using UX4G classes and patterns
- Audit or improve existing government website UX
- Design mobile-first responsive government web apps

…Claude MUST consult this skill FIRST before writing any code or making layout decisions.

---

## STEP 0 — CDN SETUP (ALWAYS INCLUDE)

Every UX4G implementation must begin with this boilerplate:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page Title</title>
    <!-- UX4G CSS -->
    <link href="https://cdn.ux4g.gov.in/UX4G@2.0.8/css/ux4g-min.css" rel="stylesheet">
  </head>
  <body>

    <!-- Page content here -->

    <!-- UX4G JS (includes Popper) -->
    <script src="https://cdn.ux4g.gov.in/UX4G@2.0.8/js/ux4g.min.js"></script>
    <!-- Accessibility Widget (MANDATORY for government sites) -->
    <script src="https://cdn.ux4g.gov.in/accessibility-beta-v1.15/accessibility-widget.js" defer></script>
  </body>
</html>
```

**Key globals set by UX4G:**
- `box-sizing: border-box` on all elements (padding does NOT affect computed width)
- Mobile-first responsive design via CSS media queries
- Native font stack (system UI fonts per OS)
- Base font: `16px` root, `rem`-based sizing throughout
- Default `background: #fff`, link colors via `$link-color`
- Cross-browser normalization via Reboot stylesheet

---

## STEP 1 — LAYOUT SYSTEM (GRID + CONTAINERS + BREAKPOINTS)

### Breakpoints (mobile-first, min-width triggers)

| Breakpoint | Class Infix | Min Width |
|---|---|---|
| Extra small | *(none)* | < 576px |
| Small | `sm` | ≥ 576px |
| Medium | `md` | ≥ 768px |
| Large | `lg` | ≥ 992px |
| Extra large | `xl` | ≥ 1200px |
| Extra extra large | `xxl` | ≥ 1400px |

### Containers

```html
<!-- Fixed-width responsive container -->
<div class="container">...</div>

<!-- Full-width at all breakpoints -->
<div class="container-fluid">...</div>

<!-- Fluid up to a specific breakpoint, then fixed -->
<div class="container-sm">...</div>
<div class="container-md">...</div>
<div class="container-lg">...</div>
<div class="container-xl">...</div>
<div class="container-xxl">...</div>
```

### 12-Column Grid System

```html
<div class="container">
  <div class="row">
    <div class="col-md-8">Main content (8/12 on md+)</div>
    <div class="col-md-4">Sidebar (4/12 on md+)</div>
  </div>
  <div class="row">
    <div class="col-sm-6 col-lg-4">Card 1</div>
    <div class="col-sm-6 col-lg-4">Card 2</div>
    <div class="col-sm-6 col-lg-4">Card 3</div>
  </div>
</div>
```

**Column rules:**
- Always wrap columns in `.row`
- Rows must be inside `.container`, `.container-fluid`, or `.container-{breakpoint}`
- Use `.col` for auto-width, `.col-{n}` for fixed width (1–12), `.col-{bp}-{n}` for responsive
- Gutters: Use `.g-{n}`, `.gx-{n}`, `.gy-{n}` (n = 0–5) to control spacing between columns

### CSS Grid (Modern Alternative)

```html
<div class="grid">
  <div class="g-col-6">Half width</div>
  <div class="g-col-6">Half width</div>
</div>
```

### Z-Index Scale (Layering)

| Component | Z-index Value |
|---|---|
| Dropdown | 1000 |
| Sticky | 1020 |
| Fixed | 1030 |
| Modal Backdrop | 1040 |
| Offcanvas | 1045 |
| Modal | 1050 |
| Popover | 1070 |
| Tooltip | 1080 |

---

## STEP 2 — TYPOGRAPHY SYSTEM

### Heading Scale

```html
<h1>h1 — UX4G Heading</h1>  <!-- Largest -->
<h2>h2 — UX4G Heading</h2>
<h3>h3 — UX4G Heading</h3>
<h4>h4 — UX4G Heading</h4>
<h5>h5 — UX4G Heading</h5>
<h6>h6 — UX4G Heading</h6>  <!-- Smallest -->

<!-- Class equivalents (for non-heading elements) -->
<p class="h1">Styled like h1</p>
<p class="h3">Styled like h3</p>
```

### Display Headings (Hero / Banner sections)

```html
<h1 class="display-1">Display 1</h1>  <!-- 5rem -->
<h1 class="display-2">Display 2</h1>  <!-- 4.5rem -->
<h1 class="display-3">Display 3</h1>  <!-- 4rem -->
<h1 class="display-4">Display 4</h1>  <!-- 3.5rem -->
<h1 class="display-5">Display 5</h1>  <!-- 3rem -->
<h1 class="display-6">Display 6</h1>  <!-- 2.5rem -->
```

### Semantic Text Classes

```html
<p class="lead">Standout paragraph (larger, lighter weight)</p>
<mark>Highlighted text</mark>
<small>Fine print / legal text</small>
<del>Deleted / removed content</del>
<s>No longer accurate</s>
<ins>Added/inserted content</ins>
<u>Underlined annotation</u>
<strong>Bold emphasis</strong>
<em>Italic / voice</em>
<abbr title="HyperText Markup Language">HTML</abbr>
```

### Title / Label / Body Heading Classes (UX4G Custom)

```html
<!-- Title scale (section headers) -->
<div class="title-1">Title 1</div>
<div class="title-2">Title 2</div>
<div class="title-3">Title 3</div>

<!-- Label scale (form labels, tags) -->
<div class="label-1">Label 1</div>
<div class="label-2">Label 2</div>
<div class="label-3">Label 3</div>

<!-- Body text scale -->
<div class="body-1">Body 1</div>
<div class="body-2">Body 2</div>
<div class="body-3">Body 3</div>
```

### List Variants

```html
<!-- Unstyled list (remove bullets/padding) -->
<ul class="list-unstyled">
  <li>Item one</li>
  <li>Item two</li>
</ul>

<!-- Horizontal inline list -->
<ul class="list-inline">
  <li class="list-inline-item">Item A</li>
  <li class="list-inline-item">Item B</li>
</ul>
```

### Blockquote with Attribution

```html
<figure>
  <blockquote class="blockquote">
    <p>Quote text here.</p>
  </blockquote>
  <figcaption class="blockquote-footer">
    Name <cite title="Source Title">Source Title</cite>
  </figcaption>
</figure>
```

---

## STEP 3 — COMPONENTS REFERENCE (Full Catalogue)

### 3.1 Accordion

Collapsible content sections — ideal for FAQs.

```html
<div class="accordion" id="faqAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button class="accordion-button" type="button" data-bs-toggle="collapse"
              data-bs-target="#collapseOne" aria-expanded="true">
        Question 1
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show"
         aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
      <div class="accordion-body">Answer to question 1.</div>
    </div>
  </div>
</div>
```

### 3.2 Alerts

```html
<div class="alert alert-primary" role="alert">Primary information</div>
<div class="alert alert-success" role="alert">Success message</div>
<div class="alert alert-danger" role="alert">Error/danger message</div>
<div class="alert alert-warning" role="alert">Warning message</div>
<div class="alert alert-info" role="alert">Info message</div>

<!-- Dismissible Alert -->
<div class="alert alert-warning alert-dismissible fade show" role="alert">
  Important notice for citizens.
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
```

### 3.3 Badge

```html
<!-- Inline badges -->
<span class="badge bg-primary">New</span>
<span class="badge bg-secondary">Updated</span>
<span class="badge bg-success">Approved</span>
<span class="badge bg-danger">Rejected</span>
<span class="badge bg-warning text-dark">Pending</span>

<!-- Pill shaped badge -->
<span class="badge rounded-pill bg-primary">5 Notifications</span>

<!-- Badge on button -->
<button type="button" class="btn btn-primary">
  Notifications <span class="badge bg-light text-dark">4</span>
</button>
```

### 3.4 Breadcrumb

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#">Home</a></li>
    <li class="breadcrumb-item"><a href="#">Services</a></li>
    <li class="breadcrumb-item active" aria-current="page">Apply</li>
  </ol>
</nav>
```

### 3.5 Buttons

```html
<!-- Solid buttons (filled) -->
<button type="button" class="btn btn-primary">Primary</button>
<button type="button" class="btn btn-secondary">Secondary</button>
<button type="button" class="btn btn-success">Success</button>
<button type="button" class="btn btn-danger">Danger</button>
<button type="button" class="btn btn-warning">Warning</button>
<button type="button" class="btn btn-info">Info</button>
<button type="button" class="btn btn-light">Light</button>
<button type="button" class="btn btn-dark">Dark</button>

<!-- Outline buttons -->
<button type="button" class="btn btn-outline-primary">Outline Primary</button>
<button type="button" class="btn btn-outline-secondary">Outline Secondary</button>

<!-- Sizes -->
<button type="button" class="btn btn-primary btn-lg">Large</button>
<button type="button" class="btn btn-primary btn-sm">Small</button>

<!-- Full width button -->
<button type="button" class="btn btn-primary w-100">Full Width</button>

<!-- Disabled -->
<button type="button" class="btn btn-primary" disabled>Disabled</button>
```

### 3.6 Button Group

```html
<div class="btn-group" role="group" aria-label="Basic example">
  <button type="button" class="btn btn-primary">Left</button>
  <button type="button" class="btn btn-primary">Middle</button>
  <button type="button" class="btn btn-primary">Right</button>
</div>
```

### 3.7 Card

```html
<!-- Basic card -->
<div class="card" style="width: 18rem;">
  <img src="..." class="card-img-top" alt="...">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <p class="card-text">Short description here.</p>
    <a href="#" class="btn btn-primary">Learn More</a>
  </div>
</div>

<!-- Card with header/footer -->
<div class="card">
  <div class="card-header">Featured</div>
  <div class="card-body">
    <h5 class="card-title">Title</h5>
    <p class="card-text">Content goes here.</p>
  </div>
  <div class="card-footer text-muted">Last updated 2 days ago</div>
</div>

<!-- Card grid layout -->
<div class="row row-cols-1 row-cols-md-3 g-4">
  <div class="col"><div class="card h-100">...</div></div>
  <div class="col"><div class="card h-100">...</div></div>
  <div class="col"><div class="card h-100">...</div></div>
</div>
```

### 3.8 Carousel

```html
<div id="mainCarousel" class="carousel slide" data-bs-ride="carousel">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#mainCarousel" data-bs-slide-to="0"
            class="active" aria-current="true"></button>
    <button type="button" data-bs-target="#mainCarousel" data-bs-slide-to="1"></button>
  </div>
  <div class="carousel-inner">
    <div class="carousel-item active">
      <img src="slide1.jpg" class="d-block w-100" alt="Slide 1">
      <div class="carousel-caption">
        <h5>Slide Title</h5>
        <p>Slide description</p>
      </div>
    </div>
    <div class="carousel-item">
      <img src="slide2.jpg" class="d-block w-100" alt="Slide 2">
    </div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#mainCarousel"
          data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#mainCarousel"
          data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>
```

### 3.9 Chips (UX4G Custom)

```html
<span class="chip">Technology</span>
<span class="chip chip-primary">Health</span>
<span class="chip chip-secondary active">Education</span>
<!-- Chips with close button -->
<span class="chip">
  Filter Tag
  <button type="button" class="btn-close btn-close-sm" aria-label="Remove"></button>
</span>
```

### 3.10 Collapse

```html
<button class="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#collapseSection">
  Toggle Content
</button>
<div class="collapse" id="collapseSection">
  <div class="card card-body">
    Hidden content shown on toggle.
  </div>
</div>
```

### 3.11 Date and Time Picker (UX4G Custom)

```html
<div class="ux4g-datepicker">
  <input type="text" class="form-control" id="datePicker" placeholder="DD/MM/YYYY">
</div>
<div class="ux4g-timepicker">
  <input type="text" class="form-control" id="timePicker" placeholder="HH:MM">
</div>
```

### 3.12 Dropdowns

```html
<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button"
          data-bs-toggle="dropdown" aria-expanded="false">
    Select Option
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Option 1</a></li>
    <li><a class="dropdown-item" href="#">Option 2</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#">Option 3</a></li>
  </ul>
</div>
```

### 3.13 Feedback Form (UX4G Custom)

```html
<div class="feedback-form">
  <h5>Rate your experience</h5>
  <div class="feedback-stars">
    <span class="star" data-value="1">★</span>
    <span class="star" data-value="2">★</span>
    <span class="star" data-value="3">★</span>
    <span class="star" data-value="4">★</span>
    <span class="star" data-value="5">★</span>
  </div>
  <textarea class="form-control mt-2" rows="3" placeholder="Your feedback..."></textarea>
  <button type="submit" class="btn btn-primary mt-2">Submit Feedback</button>
</div>
```

### 3.14 List Groups

```html
<!-- Basic list -->
<ul class="list-group">
  <li class="list-group-item">Item one</li>
  <li class="list-group-item active" aria-current="true">Active item</li>
  <li class="list-group-item disabled">Disabled item</li>
</ul>

<!-- With badges -->
<ul class="list-group">
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Documents <span class="badge bg-primary rounded-pill">14</span>
  </li>
</ul>
```

### 3.15 Modal

```html
<!-- Trigger button -->
<button type="button" class="btn btn-primary" data-bs-toggle="modal"
        data-bs-target="#confirmModal">
  Open Modal
</button>

<!-- Modal HTML -->
<div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel"
     aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="confirmModalLabel">Confirm Action</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"
                aria-label="Close"></button>
      </div>
      <div class="modal-body">
        Are you sure you want to proceed?
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal sizes -->
<div class="modal-dialog modal-sm">...</div>    <!-- Small -->
<div class="modal-dialog modal-lg">...</div>    <!-- Large -->
<div class="modal-dialog modal-xl">...</div>    <!-- Extra large -->
<div class="modal-dialog modal-fullscreen">...</div>  <!-- Fullscreen -->
```

### 3.16 Navbar

```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container-fluid">
    <!-- Brand logo -->
    <a class="navbar-brand" href="#">
      <img src="logo.svg" alt="Logo" width="30" height="24">
      Portal Name
    </a>

    <!-- Mobile toggle -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#navbarContent">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Nav links -->
    <div class="collapse navbar-collapse" id="navbarContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="#">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Services</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">About</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Vision</a></li>
            <li><a class="dropdown-item" href="#">Mission</a></li>
          </ul>
        </li>
      </ul>
      <!-- Search form -->
      <form class="d-flex" role="search">
        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
        <button class="btn btn-outline-success" type="submit">Search</button>
      </form>
    </div>
  </div>
</nav>
```

### 3.17 Navs and Tabs

```html
<!-- Tab navigation -->
<ul class="nav nav-tabs" id="mainTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab1-tab" data-bs-toggle="tab"
            data-bs-target="#tab1" type="button" role="tab">Tab 1</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab2-tab" data-bs-toggle="tab"
            data-bs-target="#tab2" type="button" role="tab">Tab 2</button>
  </li>
</ul>
<div class="tab-content" id="mainTabsContent">
  <div class="tab-pane fade show active" id="tab1" role="tabpanel">
    Content for Tab 1
  </div>
  <div class="tab-pane fade" id="tab2" role="tabpanel">
    Content for Tab 2
  </div>
</div>

<!-- Pills variant -->
<ul class="nav nav-pills">
  <li class="nav-item"><a class="nav-link active" href="#">Active</a></li>
  <li class="nav-item"><a class="nav-link" href="#">Link</a></li>
</ul>
```

### 3.18 Offcanvas (Side Drawer)

```html
<button class="btn btn-primary" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#sideMenu" aria-controls="sideMenu">
  Open Menu
</button>

<div class="offcanvas offcanvas-start" tabindex="-1" id="sideMenu"
     aria-labelledby="sideMenuLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="sideMenuLabel">Navigation Menu</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"
            aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <!-- Sidebar navigation content -->
  </div>
</div>
```

### 3.19 Pagination

```html
<nav aria-label="Results pagination">
  <ul class="pagination">
    <li class="page-item disabled">
      <a class="page-link" href="#" tabindex="-1">Previous</a>
    </li>
    <li class="page-item"><a class="page-link" href="#">1</a></li>
    <li class="page-item active" aria-current="page">
      <a class="page-link" href="#">2</a>
    </li>
    <li class="page-item"><a class="page-link" href="#">3</a></li>
    <li class="page-item">
      <a class="page-link" href="#">Next</a>
    </li>
  </ul>
</nav>

<!-- Pagination sizes -->
<ul class="pagination pagination-lg">...</ul>
<ul class="pagination pagination-sm">...</ul>
```

### 3.20 Placeholders (Skeleton Loading)

```html
<div class="card">
  <div class="card-body">
    <h5 class="card-title placeholder-glow">
      <span class="placeholder col-6"></span>
    </h5>
    <p class="card-text placeholder-glow">
      <span class="placeholder col-7"></span>
      <span class="placeholder col-4"></span>
      <span class="placeholder col-4"></span>
      <span class="placeholder col-6"></span>
    </p>
    <a href="#" tabindex="-1" class="btn btn-primary disabled placeholder col-6"></a>
  </div>
</div>
```

### 3.21 Progress

```html
<!-- Basic progress bar -->
<div class="progress">
  <div class="progress-bar" role="progressbar" style="width: 25%"
       aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
</div>

<!-- Coloured variants -->
<div class="progress">
  <div class="progress-bar bg-success" style="width: 50%"></div>
</div>
<div class="progress">
  <div class="progress-bar bg-warning" style="width: 75%"></div>
</div>

<!-- Striped animated -->
<div class="progress">
  <div class="progress-bar progress-bar-striped progress-bar-animated"
       style="width: 100%"></div>
</div>
```

### 3.22 Search Component (UX4G Custom)

```html
<div class="ux4g-search">
  <div class="search-wrapper">
    <input type="search" class="search-input form-control"
           placeholder="Search services, schemes, departments..." aria-label="Search">
    <button class="search-btn btn btn-primary" type="button">
      <i class="search-icon"></i> Search
    </button>
  </div>
  <div class="search-suggestions" aria-live="polite">
    <!-- Autocomplete suggestions populated by JS -->
  </div>
</div>
```

### 3.23 Spinners (Loading Indicators)

```html
<!-- Border spinner -->
<div class="spinner-border" role="status">
  <span class="visually-hidden">Loading...</span>
</div>

<!-- Growing spinner -->
<div class="spinner-grow" role="status">
  <span class="visually-hidden">Loading...</span>
</div>

<!-- Coloured variants -->
<div class="spinner-border text-primary" role="status"></div>
<div class="spinner-border text-success" role="status"></div>

<!-- Sizes -->
<div class="spinner-border spinner-border-sm" role="status"></div>
```

### 3.24 Stepper (Multi-Step Form — UX4G Custom)

```html
<div class="stepper">
  <div class="step completed">
    <div class="step-icon">✓</div>
    <div class="step-label">Personal Details</div>
  </div>
  <div class="step active">
    <div class="step-icon">2</div>
    <div class="step-label">Documents</div>
  </div>
  <div class="step">
    <div class="step-icon">3</div>
    <div class="step-label">Review</div>
  </div>
  <div class="step">
    <div class="step-icon">4</div>
    <div class="step-label">Submit</div>
  </div>
</div>
```

### 3.25 Toasts (Notification Snackbars)

```html
<div class="toast-container position-fixed bottom-0 end-0 p-3">
  <div id="successToast" class="toast align-items-center text-bg-success border-0"
       role="alert" aria-live="assertive" aria-atomic="true">
    <div class="d-flex">
      <div class="toast-body">
        Form submitted successfully!
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  </div>
</div>

<!-- Trigger via JS -->
<script>
  const toastEl = document.getElementById('successToast');
  const toast = new ux4g.Toast(toastEl);
  toast.show();
</script>
```

### 3.26 Tooltips & Popovers

```html
<!-- Tooltip (requires JS initialization) -->
<button type="button" class="btn btn-secondary"
        data-bs-toggle="tooltip" data-bs-placement="top"
        title="This is a helpful tooltip">Hover me</button>

<script>
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(el => new ux4g.Tooltip(el));
</script>

<!-- Popover -->
<button type="button" class="btn btn-primary"
        data-bs-toggle="popover" data-bs-title="Popover Title"
        data-bs-content="Detailed information here.">More Info</button>
```

### 3.27 Scrollspy

```html
<body data-bs-spy="scroll" data-bs-target="#navbar-main" data-bs-offset="0" tabindex="0">
  <nav id="navbar-main" class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
    <ul class="navbar-nav">
      <li class="nav-item"><a class="nav-link" href="#section1">Section 1</a></li>
      <li class="nav-item"><a class="nav-link" href="#section2">Section 2</a></li>
    </ul>
  </nav>
  <div id="section1">...</div>
  <div id="section2">...</div>
</body>
```

---

## STEP 4 — FORMS SYSTEM

### 4.1 Basic Form Controls

```html
<!-- Text input -->
<div class="mb-3">
  <label for="fullName" class="form-label">Full Name <span class="text-danger">*</span></label>
  <input type="text" class="form-control" id="fullName"
         placeholder="Enter your full name" required>
  <div class="form-text">As per Aadhaar card</div>
</div>

<!-- Email -->
<div class="mb-3">
  <label for="email" class="form-label">Email Address</label>
  <input type="email" class="form-control" id="email" placeholder="example@gov.in">
</div>

<!-- Textarea -->
<div class="mb-3">
  <label for="address" class="form-label">Address</label>
  <textarea class="form-control" id="address" rows="3"></textarea>
</div>

<!-- Disabled state -->
<input class="form-control" type="text" value="Disabled input" disabled readonly>

<!-- Size variants -->
<input class="form-control form-control-lg" type="text" placeholder="Large input">
<input class="form-control form-control-sm" type="text" placeholder="Small input">
```

### 4.2 Floating Labels

```html
<div class="form-floating mb-3">
  <input type="email" class="form-control" id="floatEmail" placeholder="name@example.com">
  <label for="floatEmail">Email address</label>
</div>

<div class="form-floating">
  <textarea class="form-control" placeholder="Leave a comment" id="floatTextarea"></textarea>
  <label for="floatTextarea">Comments</label>
</div>
```

### 4.3 Select

```html
<!-- Basic select -->
<select class="form-select" aria-label="State selection">
  <option selected>Select State</option>
  <option value="MH">Maharashtra</option>
  <option value="DL">Delhi</option>
  <option value="KA">Karnataka</option>
</select>

<!-- Multiple select -->
<select class="form-select" multiple aria-label="Multiple select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### 4.4 Checks and Radios

```html
<!-- Checkbox -->
<div class="form-check">
  <input class="form-check-input" type="checkbox" id="agreeTerms" required>
  <label class="form-check-label" for="agreeTerms">
    I agree to the Terms and Conditions
  </label>
</div>

<!-- Radio group -->
<div class="form-check">
  <input class="form-check-input" type="radio" name="gender" id="genderMale" value="male">
  <label class="form-check-label" for="genderMale">Male</label>
</div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="gender" id="genderFemale" value="female">
  <label class="form-check-label" for="genderFemale">Female</label>
</div>

<!-- Switch toggle -->
<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" id="notifToggle">
  <label class="form-check-label" for="notifToggle">Enable Notifications</label>
</div>

<!-- Inline checkboxes -->
<div class="form-check form-check-inline">
  <input class="form-check-input" type="checkbox" id="opt1" value="option1">
  <label class="form-check-label" for="opt1">Option 1</label>
</div>
```

### 4.5 Range Slider

```html
<label for="budgetRange" class="form-label">Budget Range</label>
<input type="range" class="form-range" min="0" max="100" step="5" id="budgetRange">
```

### 4.6 Input Group

```html
<!-- Prefix icon/text -->
<div class="input-group mb-3">
  <span class="input-group-text">₹</span>
  <input type="number" class="form-control" placeholder="Amount" aria-label="Amount">
</div>

<!-- Append button -->
<div class="input-group">
  <input type="text" class="form-control" placeholder="Search" aria-label="Search">
  <button class="btn btn-outline-secondary" type="button">Search</button>
</div>

<!-- Multiple addons -->
<div class="input-group">
  <span class="input-group-text">+91</span>
  <input type="tel" class="form-control" placeholder="Mobile Number">
</div>
```

### 4.7 Form Validation

```html
<form class="needs-validation" novalidate>
  <div class="mb-3">
    <label for="aadhar" class="form-label">Aadhaar Number</label>
    <input type="text" class="form-control" id="aadhar"
           pattern="[0-9]{12}" maxlength="12" required>
    <div class="valid-feedback">Looks good!</div>
    <div class="invalid-feedback">Please enter a valid 12-digit Aadhaar number.</div>
  </div>
  <button class="btn btn-primary" type="submit">Submit</button>
</form>

<script>
  // Bootstrap-style form validation
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
</script>
```

### 4.8 Form Layout

```html
<!-- Horizontal form -->
<div class="row mb-3">
  <label for="inputEmail" class="col-sm-2 col-form-label">Email</label>
  <div class="col-sm-10">
    <input type="email" class="form-control" id="inputEmail">
  </div>
</div>

<!-- Inline form -->
<div class="row g-3 align-items-center">
  <div class="col-auto">
    <label for="inputSearch" class="col-form-label">Search</label>
  </div>
  <div class="col-auto">
    <input type="text" id="inputSearch" class="form-control">
  </div>
  <div class="col-auto">
    <button type="submit" class="btn btn-primary">Go</button>
  </div>
</div>
```

---

## STEP 5 — UTILITIES TOOLKIT

### 5.1 Spacing

Pattern: `{property}{side}-{size}` | size = 0 to 5 (+ auto)

```html
<!-- Margin -->
<div class="mt-3">  <!-- margin-top: 1rem -->
<div class="mb-4">  <!-- margin-bottom: 1.5rem -->
<div class="mx-auto"> <!-- center horizontally -->
<div class="ms-2">  <!-- margin-start (left) -->
<div class="me-2">  <!-- margin-end (right) -->

<!-- Padding -->
<div class="p-3">   <!-- all sides 1rem -->
<div class="px-4">  <!-- horizontal padding 1.5rem -->
<div class="py-2">  <!-- vertical padding 0.5rem -->
<div class="ps-3">  <!-- padding-start (left) -->
<div class="pe-3">  <!-- padding-end (right) -->
```

### 5.2 Colors & Background

```html
<!-- Text colors -->
<p class="text-primary">Primary</p>
<p class="text-secondary">Secondary</p>
<p class="text-success">Success</p>
<p class="text-danger">Danger</p>
<p class="text-warning">Warning</p>
<p class="text-info">Info</p>
<p class="text-light bg-dark">Light</p>
<p class="text-dark">Dark</p>
<p class="text-muted">Muted/Subtle</p>
<p class="text-white bg-primary">White</p>

<!-- Background colors -->
<div class="bg-primary text-white">Primary bg</div>
<div class="bg-secondary text-white">Secondary bg</div>
<div class="bg-success text-white">Success bg</div>
<div class="bg-danger text-white">Danger bg</div>
<div class="bg-warning text-dark">Warning bg</div>
<div class="bg-info text-dark">Info bg</div>
<div class="bg-light text-dark">Light bg</div>
<div class="bg-dark text-white">Dark bg</div>
<div class="bg-transparent">Transparent bg</div>

<!-- Background + text combo using bg-{color} classes -->
<div class="text-bg-primary p-3">Text on primary</div>
<div class="text-bg-success p-3">Text on success</div>
```

### 5.3 Borders

```html
<!-- Add border -->
<div class="border">All sides</div>
<div class="border-top">Top only</div>
<div class="border-bottom">Bottom only</div>
<div class="border-start">Left only</div>
<div class="border-end">Right only</div>

<!-- Border colors -->
<div class="border border-primary">...</div>
<div class="border border-danger">...</div>

<!-- Border radius -->
<div class="rounded">Rounded all corners</div>
<div class="rounded-top">Top corners</div>
<div class="rounded-circle">Full circle</div>
<div class="rounded-pill">Pill shape</div>
<div class="rounded-0">Remove radius</div>

<!-- Border width -->
<div class="border border-1">1px border</div>
<div class="border border-3">3px border</div>
<div class="border border-5">5px border</div>
```

### 5.4 Display

```html
<div class="d-none">Hidden always</div>
<div class="d-block">Block</div>
<div class="d-inline">Inline</div>
<div class="d-inline-block">Inline-block</div>
<div class="d-flex">Flex container</div>
<div class="d-grid">Grid container</div>

<!-- Responsive display -->
<div class="d-none d-md-block">Hidden on mobile, visible on md+</div>
<div class="d-block d-lg-none">Visible on mobile, hidden on lg+</div>
```

### 5.5 Flexbox Utilities

```html
<!-- Flex direction -->
<div class="d-flex flex-row">Row (default)</div>
<div class="d-flex flex-column">Column</div>
<div class="d-flex flex-row-reverse">Reverse row</div>

<!-- Justify content -->
<div class="d-flex justify-content-start">Left</div>
<div class="d-flex justify-content-center">Center</div>
<div class="d-flex justify-content-end">Right</div>
<div class="d-flex justify-content-between">Space between</div>
<div class="d-flex justify-content-around">Space around</div>
<div class="d-flex justify-content-evenly">Space evenly</div>

<!-- Align items -->
<div class="d-flex align-items-start">Top</div>
<div class="d-flex align-items-center">Middle</div>
<div class="d-flex align-items-end">Bottom</div>

<!-- Flex wrap -->
<div class="d-flex flex-wrap">Wrap items</div>
<div class="d-flex flex-nowrap">No wrap</div>

<!-- Gap between flex/grid items -->
<div class="d-flex gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 5.6 Sizing

```html
<!-- Width -->
<div class="w-25">25% width</div>
<div class="w-50">50% width</div>
<div class="w-75">75% width</div>
<div class="w-100">100% width</div>
<div class="mw-100">Max 100% width</div>

<!-- Height -->
<div class="h-25">25% height</div>
<div class="h-100">100% height</div>
<div class="vh-100">100vh height</div>
```

### 5.7 Text Utilities

```html
<!-- Alignment -->
<p class="text-start">Left aligned</p>
<p class="text-center">Center aligned</p>
<p class="text-end">Right aligned</p>

<!-- Responsive alignment -->
<p class="text-start text-md-center">Left on mobile, center on md+</p>

<!-- Transform -->
<p class="text-uppercase">uppercase text</p>
<p class="text-lowercase">LOWERCASE TEXT</p>
<p class="text-capitalize">capitalized text</p>

<!-- Weight & style -->
<p class="fw-bold">Bold text</p>
<p class="fw-normal">Normal weight</p>
<p class="fw-light">Light weight</p>
<p class="fst-italic">Italic text</p>
<p class="fst-normal">Normal style</p>

<!-- Decoration -->
<p class="text-decoration-underline">Underline</p>
<p class="text-decoration-line-through">Strikethrough</p>
<p class="text-decoration-none">No decoration</p>

<!-- Wrapping -->
<p class="text-wrap">Text wraps normally</p>
<p class="text-nowrap">Text will not wrap</p>
<p class="text-truncate" style="max-width: 200px;">This very long text will be truncated with ellipsis</p>
```

### 5.8 Position

```html
<div class="position-static">Static</div>
<div class="position-relative">Relative</div>
<div class="position-absolute">Absolute</div>
<div class="position-fixed">Fixed</div>
<div class="position-sticky top-0">Sticky top</div>

<!-- Fixed positioning helpers -->
<div class="fixed-top">Fixed to top of viewport</div>
<div class="fixed-bottom">Fixed to bottom of viewport</div>
<div class="sticky-top">Sticky top on scroll</div>
<div class="sticky-bottom">Sticky bottom on scroll</div>
```

### 5.9 Shadows

```html
<div class="shadow-none">No shadow</div>
<div class="shadow-sm">Small shadow</div>
<div class="shadow">Default shadow</div>
<div class="shadow-lg">Large shadow</div>
```

### 5.10 Overflow

```html
<div class="overflow-auto">Auto scroll</div>
<div class="overflow-hidden">Hidden overflow</div>
<div class="overflow-visible">Visible</div>
<div class="overflow-scroll">Always scroll</div>

<!-- X/Y specific -->
<div class="overflow-x-auto">Horizontal scroll</div>
<div class="overflow-y-auto">Vertical scroll</div>
```

### 5.11 Visibility & Opacity

```html
<div class="visible">Visible (takes space)</div>
<div class="invisible">Invisible (still takes space)</div>
<!-- vs d-none which removes from layout entirely -->

<div class="opacity-100">100% opacity</div>
<div class="opacity-75">75% opacity</div>
<div class="opacity-50">50% opacity</div>
<div class="opacity-25">25% opacity</div>
<div class="opacity-0">0% opacity (invisible)</div>
```

---

## STEP 6 — HELPERS

### 6.1 Visually Hidden (Accessibility)

```html
<!-- Visible to screen readers only, not visual users -->
<span class="visually-hidden">Screen reader only text</span>
<span class="visually-hidden-focusable">Visible when focused (skip links)</span>
```

### 6.2 Clearfix

```html
<div class="clearfix">
  <div class="float-start">Left floated</div>
  <div class="float-end">Right floated</div>
</div>
```

### 6.3 Stretched Link (Entire Card Clickable)

```html
<div class="card position-relative">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <a href="#" class="stretched-link">Entire card is clickable</a>
  </div>
</div>
```

### 6.4 Stacks (Shorthand for Flex Layouts)

```html
<!-- Vertical stack (flex column) -->
<div class="vstack gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Horizontal stack (flex row) -->
<div class="hstack gap-3">
  <div>Item A</div>
  <div class="ms-auto">Item B (pushed right)</div>
  <div class="vr"></div>  <!-- Vertical divider -->
  <div>Item C</div>
</div>
```

### 6.5 Ratios (Responsive Embeds)

```html
<div class="ratio ratio-16x9">
  <iframe src="https://www.youtube.com/embed/..." title="Video" allowfullscreen></iframe>
</div>

<!-- Available ratios: 1x1, 4x3, 16x9, 21x9 -->
<div class="ratio ratio-4x3">...</div>
<div class="ratio ratio-1x1">...</div>
```

---

## STEP 7 — ACCESSIBILITY (MANDATORY FOR GOVERNMENT SITES)

### 7.1 Accessibility Widget (ALWAYS Include)

```html
<!-- Place before </body> -->
<script src="https://cdn.ux4g.gov.in/accessibility-beta-v1.15/accessibility-widget.js" defer></script>
```

This widget provides:
- Font size controls (−A / A / A+)
- High contrast mode
- Dark mode toggle
- Dyslexia-friendly font
- Screen reader optimizations
- Compliance with WCAG 2.1 AA, GIGW (Guidelines for Indian Government Websites), IS 17802

### 7.2 Dark Mode Override Pattern

```css
/* Default style */
.hero-section {
  background-color: #ccc;
}

/* Dark mode override (triggered by widget adding .dark-mode to <html>) */
.dark-mode .hero-section {
  background-color: #1a1a1a;
}

.dark-mode .btn-primary {
  background-color: #004080;
}
```

### 7.3 ARIA Roles & Attributes (Required)

```html
<!-- Landmark roles -->
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main">...</main>
<aside role="complementary" aria-label="Sidebar">...</aside>
<footer role="contentinfo">...</footer>

<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">Status messages here</div>
<div aria-live="assertive">Critical alerts here</div>

<!-- Expanded state for toggles -->
<button aria-expanded="false" aria-controls="menuContent">Toggle Menu</button>

<!-- Current page in nav -->
<a class="nav-link active" aria-current="page" href="#">Current Page</a>

<!-- Loading state -->
<button aria-busy="true" disabled>Submitting...</button>

<!-- Required fields -->
<input type="text" aria-required="true" required>

<!-- Error messages linked to inputs -->
<input type="email" id="email" aria-describedby="emailError" aria-invalid="true">
<span id="emailError" class="text-danger">Please enter a valid email.</span>
```

### 7.4 Skip Navigation Link (Keyboard Accessibility)

```html
<!-- First element inside <body> -->
<a href="#main-content" class="visually-hidden-focusable">Skip to main content</a>
...
<main id="main-content" role="main" tabindex="-1">
  ...
</main>
```

### 7.5 Focus Management Rules

- All interactive elements must have visible `:focus` styles
- Use `tabindex="0"` to make non-interactive elements focusable
- Use `tabindex="-1"` for programmatically focused elements (e.g., modal headings)
- Never use `tabindex` values > 0 (disrupts natural tab order)
- Modals should trap focus when open
- On modal close, return focus to triggering element

### 7.6 Image Accessibility

```html
<!-- Informative image -->
<img src="govt-scheme.jpg" alt="Pradhan Mantri Awas Yojana: Affordable Housing Scheme">

<!-- Decorative image (empty alt) -->
<img src="divider.svg" alt="" role="presentation">

<!-- Logo -->
<img src="gov-logo.svg" alt="Government of India" width="60" height="60">

<!-- Responsive images -->
<img src="photo.jpg" class="img-fluid" alt="...">

<!-- Thumbnail -->
<img src="thumb.jpg" class="img-thumbnail" alt="...">
```

---

## STEP 8 — UX4G CHART SYSTEM

```html
<!-- CDN for UX4G Charts -->
<script src="https://cdn.ux4g.gov.in/UX4G@2.0.8/js/ux4g-chart.min.js"></script>

<!-- Canvas element -->
<canvas id="myChart" width="400" height="200"></canvas>

<script>
  const ctx = document.getElementById('myChart').getContext('2d');
  const chart = new UX4GChart(ctx, {
    type: 'bar',  // bar, line, pie, doughnut, radar, polarArea
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Scheme Applications',
        data: [12000, 19000, 15000, 22000],
        backgroundColor: ['#0056b3', '#006fb3', '#0088b3', '#00a1b3']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Quarterly Statistics' }
      }
    }
  });
</script>
```

---

## STEP 9 — DESIGN PATTERNS FOR GOVERNMENT PORTALS

### 9.1 Government Portal Header Pattern

```html
<header>
  <!-- Top bar: GOI branding -->
  <div class="bg-primary py-1">
    <div class="container d-flex align-items-center">
      <img src="india-flag.png" alt="Indian Flag" height="20" class="me-2">
      <small class="text-white fw-bold">Government of India</small>
      <div class="ms-auto">
        <!-- Accessibility controls -->
        <span class="text-white small">-A &nbsp; A &nbsp; A+</span>
      </div>
    </div>
  </div>

  <!-- Ministry/Department header -->
  <div class="bg-white py-3 border-bottom">
    <div class="container d-flex align-items-center">
      <img src="ashoka-emblem.svg" alt="Emblem of India" height="60" class="me-3">
      <div>
        <h1 class="h5 mb-0 text-primary fw-bold">Ministry of XYZ</h1>
        <p class="mb-0 text-muted small">Government of India</p>
      </div>
      <div class="ms-auto">
        <img src="digital-india.svg" alt="Digital India" height="40">
      </div>
    </div>
  </div>
</header>
```

### 9.2 Multi-Step Application Form Pattern

```html
<!-- Stepper navigation -->
<div class="stepper mb-4">
  <div class="step completed"><div class="step-icon">✓</div><div class="step-label">Eligibility Check</div></div>
  <div class="step active"><div class="step-icon">2</div><div class="step-label">Personal Details</div></div>
  <div class="step"><div class="step-icon">3</div><div class="step-label">Documents</div></div>
  <div class="step"><div class="step-label">Declaration</div></div>
  <div class="step"><div class="step-label">Submit</div></div>
</div>

<!-- Step content card -->
<div class="card shadow-sm">
  <div class="card-header bg-primary text-white">
    <h5 class="mb-0">Step 2: Personal Details</h5>
  </div>
  <div class="card-body">
    <form class="needs-validation" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" class="form-control" id="firstName" required>
            <label for="firstName">First Name *</label>
            <div class="invalid-feedback">First name is required.</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" class="form-control" id="lastName" required>
            <label for="lastName">Last Name *</label>
          </div>
        </div>
        <!-- More fields -->
      </div>
      <div class="d-flex justify-content-between mt-4">
        <button type="button" class="btn btn-outline-secondary">← Previous</button>
        <button type="submit" class="btn btn-primary">Save & Continue →</button>
      </div>
    </form>
  </div>
</div>
```

### 9.3 Dashboard / Stats Cards Pattern

```html
<div class="row g-4 mb-4">
  <div class="col-6 col-lg-3">
    <div class="card text-bg-primary shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="card-text small mb-1 opacity-75">Total Applications</p>
            <h3 class="fw-bold mb-0">1,24,567</h3>
          </div>
          <span class="fs-2 opacity-50">📋</span>
        </div>
        <p class="card-text small mt-2 mb-0 opacity-75">↑ 12% from last month</p>
      </div>
    </div>
  </div>
  <!-- Repeat for other stats -->
</div>
```

### 9.4 Service Card Grid Pattern

```html
<section class="py-5">
  <div class="container">
    <h2 class="text-center mb-4">Our Services</h2>
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
      <div class="col">
        <div class="card h-100 text-center border-0 shadow-sm">
          <div class="card-body">
            <div class="fs-1 mb-3">🏠</div>
            <h5 class="card-title">Housing</h5>
            <p class="card-text text-muted small">Apply for affordable housing schemes.</p>
            <a href="#" class="btn btn-outline-primary btn-sm">Apply Now</a>
          </div>
        </div>
      </div>
      <!-- More service cards -->
    </div>
  </div>
</section>
```

### 9.5 Data Table Pattern

```html
<div class="table-responsive">
  <table class="table table-striped table-hover align-middle">
    <thead class="table-primary">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Application ID</th>
        <th scope="col">Applicant Name</th>
        <th scope="col">Scheme</th>
        <th scope="col">Date Applied</th>
        <th scope="col">Status</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">1</th>
        <td>APP-2024-001</td>
        <td>Ramesh Kumar</td>
        <td>PMAY</td>
        <td>01 Jan 2024</td>
        <td><span class="badge bg-success">Approved</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary">View</button>
          <button class="btn btn-sm btn-outline-secondary">Download</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## STEP 10 — QUALITY CHECKLIST (Run Before Output)

Before finalizing any UX4G-based UI/UX output, Claude MUST verify:

### HTML Structure
- [ ] `<!doctype html>` declared
- [ ] `<html lang="en">` (or appropriate language)
- [ ] `<meta charset="utf-8">` present
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">` present
- [ ] UX4G CSS CDN linked in `<head>`
- [ ] UX4G JS CDN linked before `</body>`
- [ ] Accessibility widget script included

### Layout
- [ ] Mobile-first approach used
- [ ] Breakpoints applied responsively (`col-sm-`, `col-md-`, `col-lg-`)
- [ ] Content wrapped in appropriate `.container` or `.container-fluid`
- [ ] Rows contain only columns, columns contain content
- [ ] Gutters specified where needed

### Typography
- [ ] Heading hierarchy is logical (h1 → h2 → h3, not skipped)
- [ ] Display headings used only for hero sections

### Forms
- [ ] All inputs have associated `<label>` elements (not just placeholder)
- [ ] Labels are connected via `for` + `id`

### Accessibility
- [ ] Skip navigation link is first element
- [ ] Semantic HTML5 landmark elements used (header, main, nav, footer)
- [ ] All images have descriptive `alt` text (or `alt=""` for decorative)

---

## APPENDIX A — SASS VARIABLES (For Custom Builds)

Key overrideable variables in `_variables.scss`:

```scss
// Colors
$primary:       #0056b3;
$secondary:     #6c757d;
$success:       #198754;
$warning:       #ffc107;
$danger:        #dc3545;
$light:         #f8f9fa;
$dark:          #212529;

// Typography
$font-family-base: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

---

## APPENDIX B — JAVASCRIPT API (For Dynamic Behaviors)

```javascript
// Initialize all tooltips
const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
[...tooltips].map(el => new ux4g.Tooltip(el));

// Programmatic modal control
const modal = new ux4g.Modal(document.getElementById('myModal'));
modal.show();
```
