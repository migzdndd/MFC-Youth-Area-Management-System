using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class ModernComboBox : ComboBox
{
    public ModernComboBox()
    {
        Height = ThemeSizes.InputHeight;
        DropDownStyle = ComboBoxStyle.DropDownList;
        FlatStyle = FlatStyle.Flat;
        Font = ThemeFonts.Body;
        BackColor = ThemeColors.Surface;
        ForeColor = ThemeColors.TextPrimary;
        IntegralHeight = false;
        ItemHeight = 30;
        DrawMode = System.Windows.Forms.DrawMode.OwnerDrawFixed;
    }

    protected override void OnDrawItem(DrawItemEventArgs e)
    {
        if (e.Index < 0) return;
        var selected = (e.State & DrawItemState.Selected) == DrawItemState.Selected;
        using var background = new SolidBrush(selected ? ThemeColors.PrimarySoft : ThemeColors.Surface);
        e.Graphics.FillRectangle(background, e.Bounds);
        var text = GetItemText(Items[e.Index]);
        TextRenderer.DrawText(e.Graphics, text, Font,
            new Rectangle(e.Bounds.X + 8, e.Bounds.Y, Math.Max(0, e.Bounds.Width - 10), e.Bounds.Height),
            ThemeColors.TextPrimary, TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        e.DrawFocusRectangle();
    }
}
