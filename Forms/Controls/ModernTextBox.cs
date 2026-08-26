using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class ModernTextBox : UserControl
{
    private readonly TextBox _box;
    private bool _focused;
    public string Placeholder { get=>_box.PlaceholderText; set=>_box.PlaceholderText=value; }
    public string TextValue { get=>_box.Text; set=>_box.Text=value; }
    public bool Multiline { get=>_box.Multiline; set { _box.Multiline=value; if(value){Height=96;_box.Dock=DockStyle.Fill;_box.Margin=new Padding(10);} } }
    public event EventHandler? TextValueChanged;

    public ModernTextBox()
    {
        Height=ThemeSizes.InputHeight;BackColor=ThemeColors.Surface;Padding=new Padding(10,8,10,7);DoubleBuffered=true;
        _box=new TextBox{BorderStyle=BorderStyle.None,Dock=DockStyle.Fill,Font=ThemeFonts.Body,BackColor=ThemeColors.Surface,ForeColor=ThemeColors.TextPrimary};Controls.Add(_box);
        _box.GotFocus+=(_,__)=>{_focused=true;Invalidate();};_box.LostFocus+=(_,__)=>{_focused=false;Invalidate();};_box.TextChanged+=(_,e)=>TextValueChanged?.Invoke(this,e);
    }
    protected override void OnPaint(PaintEventArgs e){base.OnPaint(e);using var path=UiHelper.Rounded(new Rectangle(0,0,Width-1,Height-1),8);using var pen=new Pen(_focused?ThemeColors.Primary:ThemeColors.Border,_focused?2:1);e.Graphics.SmoothingMode=System.Drawing.Drawing2D.SmoothingMode.AntiAlias;e.Graphics.DrawPath(pen,path);}
}
