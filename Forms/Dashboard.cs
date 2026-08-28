using System.Runtime.InteropServices;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class Dashboard : Form
{
    private readonly Panel _content;
    private Label _pageLabel = null!;
    private readonly Dictionary<string, NavigationButton> _nav = new();
    private Form? _current;

    public Dashboard()
    {
        Text = ApplicationConstants.AppName;
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(1050, 680);
        Size = new Size(1280, 760);
        FormBorderStyle = FormBorderStyle.None;
        BackColor = ThemeColors.Primary;
        Padding = new Padding(7);
        AutoScaleMode = AutoScaleMode.Dpi;
        KeyPreview = true;

        var shell = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = ThemeColors.Background,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        shell.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.TitleBarHeight));
        shell.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(shell);

        var title = BuildTitleBar();
        shell.Controls.Add(title, 0, 0);

        var body = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 1,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, ThemeSizes.SidebarWidth));
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        body.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        shell.Controls.Add(body, 0, 1);

        var sidebar = BuildSidebar();
        body.Controls.Add(sidebar, 0, 0);

        _content = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = ThemeColors.Background,
            Padding = new Padding(ThemeSizes.PagePadding),
            Margin = Padding.Empty
        };
        body.Controls.Add(_content, 1, 0);

        ShowPage("Dashboard", new DashboardHomeForm());
    }

    private Control BuildTitleBar()
    {
        var title = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = ThemeColors.Surface,
            ColumnCount = 3,
            RowCount = 1,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        title.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, ThemeSizes.SidebarWidth));
        title.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        title.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 138));
        title.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        title.MouseDown += TitleMouseDown;
        title.DoubleClick += (_, _) => ToggleMaximize();

        var brand = new Label
        {
            Text = "MFC YOUTH",
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft,
            Padding = new Padding(18, 0, 0, 0),
            Font = ThemeFonts.AppBrand,
            ForeColor = ThemeColors.Primary
        };
        brand.MouseDown += TitleMouseDown;
        brand.DoubleClick += (_, _) => ToggleMaximize();
        title.Controls.Add(brand, 0, 0);

        _pageLabel = new Label
        {
            Text = "Dashboard",
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextSecondary
        };
        _pageLabel.MouseDown += TitleMouseDown;
        _pageLabel.DoubleClick += (_, _) => ToggleMaximize();
        title.Controls.Add(_pageLabel, 1, 0);

        var controls = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            WrapContents = false,
            Padding = new Padding(0, 7, 0, 7),
            Margin = Padding.Empty
        };
        controls.Controls.Add(TitleButton("—", (_, _) => WindowState = FormWindowState.Minimized));
        controls.Controls.Add(TitleButton("□", (_, _) => ToggleMaximize()));
        controls.Controls.Add(TitleButton("×", (_, _) => Close(), true));
        title.Controls.Add(controls, 2, 0);

        return title;
    }

    private Control BuildSidebar()
    {
        var sidebar = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = ThemeColors.Primary,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        sidebar.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        sidebar.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.SidebarBrandHeight));
        sidebar.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        sidebar.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.SidebarArtworkHeight));

        var sideBrand = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(18, 18, 12, 12),
            Margin = Padding.Empty,
            BackColor = Color.Transparent
        };
        sideBrand.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        sideBrand.RowStyles.Add(new RowStyle(SizeType.Percent, 58));
        sideBrand.RowStyles.Add(new RowStyle(SizeType.Percent, 42));
        sideBrand.Controls.Add(new Label
        {
            Text = "MFC YOUTH",
            Dock = DockStyle.Fill,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 0);
        sideBrand.Controls.Add(new Label
        {
            Text = "AREA MANAGEMENT SYSTEM",
            Dock = DockStyle.Fill,
            ForeColor = Color.FromArgb(178, 194, 214),
            Font = ThemeFonts.Small,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 1);
        sidebar.Controls.Add(sideBrand, 0, 0);

        var navHost = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10, 6, 10, 12),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Primary
        };
        sidebar.Controls.Add(navHost, 0, 1);

        // DockStyle.Top stacks in reverse z-order, so add bottom-to-top.
        AddNav(navHost, "Events", "events", () => new EventsForm(this));
        AddNav(navHost, "Activity Reports", "reports", () => new ActivityReportsForm(this));
        AddNav(navHost, "Services", "services", () => new ServicesForm(this));
        AddNav(navHost, "Chapters", "chapters", () => new ChaptersForm(this));
        AddNav(navHost, "Members", "members", () => new MembersForm(this));
        AddNav(navHost, "Dashboard", "dashboard", () => new DashboardHomeForm());

        // This row always remains at the bottom of the sidebar. Its height is
        // fixed in logical pixels and automatically follows Windows DPI scaling.
        // The artwork control itself preserves the aspect ratio of a custom PNG.
        sidebar.Controls.Add(new SidebarArtworkPanel(), 0, 2);

        return sidebar;
    }

    private Button TitleButton(string text, EventHandler click, bool danger = false)
    {
        var button = new Button
        {
            Text = text,
            Width = 42,
            Height = 42,
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.Transparent,
            ForeColor = danger ? ThemeColors.Danger : ThemeColors.TextSecondary,
            Font = new Font("Segoe UI", 15, FontStyle.Bold),
            Cursor = Cursors.Hand,
            Margin = Padding.Empty,
            TabStop = false
        };
        button.FlatAppearance.BorderSize = 0;
        button.Click += click;
        return button;
    }

    private void AddNav(Control host, string text, string icon, Func<Form> factory)
    {
        var button = new NavigationButton
        {
            Text = "   " + text,
            Image = UiHelper.LoadIcon(icon),
            ImageAlign = ContentAlignment.MiddleLeft,
            TextImageRelation = TextImageRelation.ImageBeforeText,
            Tag = text
        };
        button.Click += (_, _) =>
        {
            try
            {
                ShowPage(text, factory());
            }
            catch (Exception ex)
            {
                AppLogger.Error($"Open page: {text}", ex);
                CustomDialog.Show(this, "Page Could Not Open", $"{text} could not be opened.\n\n{ex.Message}", true);
            }
        };
        host.Controls.Add(button);
        _nav[text] = button;
    }

    public void ShowPage(string name, Form form)
    {
        var previous = _current;
        _current = null;
        if (previous != null)
        {
            _content.Controls.Remove(previous);
            previous.Close();
            previous.Dispose();
        }

        _current = form;
        _pageLabel.Text = name;
        foreach (var navButton in _nav.Values)
            navButton.Active = Equals(navButton.Tag, name);

        form.TopLevel = false;
        form.FormBorderStyle = FormBorderStyle.None;
        form.Dock = DockStyle.Fill;
        _content.SuspendLayout();
        try
        {
            _content.Controls.Add(form);
            form.Show();
            form.PerformLayout();
            form.Invalidate(true);
        }
        finally
        {
            _content.ResumeLayout(true);
        }

        // Embedded WinForms pages can keep stale pixels in owner-drawn child
        // controls when a page is removed and another one is shown. Force the
        // newly visible page and its children to paint immediately instead of
        // waiting for a mouse hover/expose event.
        _content.Invalidate(true);
        _content.Update();
    }

    public void RefreshDashboardIfVisible()
    {
        if (_current is DashboardHomeForm home) home.RefreshStats();
    }

    public void Notify(string message, bool error = false) => ToastNotification.Show(this, message, error);

    private void ToggleMaximize()
    {
        if (WindowState == FormWindowState.Maximized)
        {
            WindowState = FormWindowState.Normal;
            return;
        }
        MaximizedBounds = Screen.FromControl(this).WorkingArea;
        WindowState = FormWindowState.Maximized;
    }

    private void TitleMouseDown(object? sender, MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Left) return;
        ReleaseCapture();
        SendMessage(Handle, 0xA1, 0x2, 0);
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        MaximizedBounds = Screen.FromHandle(Handle).WorkingArea;
    }

    protected override void WndProc(ref Message m)
    {
        const int WmNcHitTest = 0x84;
        const int HtClient = 1;
        const int grip = 8;

        base.WndProc(ref m);
        if (m.Msg != WmNcHitTest || m.Result != (IntPtr)HtClient || WindowState == FormWindowState.Maximized) return;

        var raw = m.LParam.ToInt64();
        var sx = unchecked((short)(raw & 0xFFFF));
        var sy = unchecked((short)((raw >> 16) & 0xFFFF));
        var point = PointToClient(new Point(sx, sy));

        if (point.Y < grip)
        {
            if (point.X < grip) m.Result = (IntPtr)13;
            else if (point.X > Width - grip) m.Result = (IntPtr)14;
            else m.Result = (IntPtr)12;
        }
        else if (point.Y > Height - grip)
        {
            if (point.X < grip) m.Result = (IntPtr)16;
            else if (point.X > Width - grip) m.Result = (IntPtr)17;
            else m.Result = (IntPtr)15;
        }
        else if (point.X < grip) m.Result = (IntPtr)10;
        else if (point.X > Width - grip) m.Result = (IntPtr)11;
    }

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, int wParam, int lParam);
}
