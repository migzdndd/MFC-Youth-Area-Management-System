using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public static class ModalHelper
{
    public static DialogResult Show(IWin32Window owner, Func<Form> createForm, string operation)
    {
        try
        {
            using var form = createForm();
            return form.ShowDialog(owner);
        }
        catch (Exception ex)
        {
            AppLogger.Error(operation, ex);
            CustomDialog.Show(owner, "Unable to Continue", "The requested window could not be opened. Please try again. If the problem continues, check the local application log.", true);
            return DialogResult.Abort;
        }
    }
}
