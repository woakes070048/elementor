import { __createSlice, type PayloadAction } from '@elementor/store';

import { type Document } from '../types';

type State = {
	entities: Record< Document[ 'id' ], Document >;
	activeId: Document[ 'id' ] | null; // The currently editing document.
	hostId: Document[ 'id' ] | null; // The document that host all the other documents.
};

const initialState: State = {
	entities: {},
	activeId: null,
	hostId: null,
};

type StateWithActiveId = Omit< State, 'activeId' > & { activeId: NonNullable< State[ 'activeId' ] > };

function hasActiveEntity( state: State ): state is StateWithActiveId {
	return !! ( state.activeId && state.entities[ state.activeId ] );
}

export const slice = __createSlice( {
	name: 'documents',
	initialState,
	reducers: {
		init( state, { payload }: PayloadAction< State > ) {
			state.entities = payload.entities;
			state.hostId = payload.hostId;
			state.activeId = payload.activeId;
		},

		activateDocument( state, action: PayloadAction< Document > ) {
			state.entities[ action.payload.id ] = action.payload;
			state.activeId = action.payload.id;
		},

		setAsHost( state, action: PayloadAction< Document[ 'id' ] > ) {
			state.hostId = action.payload;
		},

		updateActiveDocument( state, action: PayloadAction< Partial< Document > > ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ] = {
					...state.entities[ state.activeId ],
					...action.payload,
				};
			}
		},

		startSaving( state ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ].isSaving = true;
			}
		},

		endSaving( state, action: PayloadAction< Document > ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ] = {
					...action.payload,
					isSaving: false,
				};
			}
		},

		startSavingDraft: ( state ) => {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ].isSavingDraft = true;
			}
		},

		endSavingDraft( state, action: PayloadAction< Document > ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ] = {
					...action.payload,
					isSavingDraft: false,
				};
			}
		},

		markAsDirty( state ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ].isDirty = true;
			}
		},

		markAsPristine( state ) {
			if ( hasActiveEntity( state ) ) {
				state.entities[ state.activeId ].isDirty = false;
			}
		},
	},
} );
